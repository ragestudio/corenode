const fs = require("fs")
const path = require("path")
const execa = require('execa')

const spawn = require("cross-spawn")
const helpers = require('@corenode/helpers')
const agents = require('./agents')

const { validateName, npmPublishLib } = require("./lib")
const { extractJSONObject } = require("extract-first-json")

const dependenciesTypes = ["dependencies", "devDependencies", "peerDependencies"]
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function check(dependency) {
    try {
        return (
            process.moduleLoadList.indexOf("NativeModule " + dependency) >= 0 ||
            require("fs").existsSync(require.resolve(dependency))
        )
    } catch (error) {
        return false
    }
}

async function lastVersion(dependency) {
    const cmd = `${npmCommand} show ${dependency} version`
    const res = await execa.command(cmd)
    return res.stdout
}

function lastVersionSync(dependency) {
    const cmd = `${npmCommand} show ${dependency} version`
    const res = execa.commandSync(cmd)
    return res.stdout
}

function write(mutation) {
    let data = JSON.parse(fs.readFileSync(global._packages._project, 'utf8'))
    data = { ...data, ...mutation }

    return fs.writeFileSync(global._packages._project, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

/**
 * @param {string} [filePathOrDirPath]
 * @returns {Promise<readPkg.NormalizedPackageJson>}
 */
const readPkgWithPath = (filePathOrDirPath) => {
    if (filePathOrDirPath) {
        const isJSON = path.extname(filePathOrDirPath) === ".json"
        if (isJSON) {
            return Promise.resolve(require(filePathOrDirPath))
        }

        return readPkg({ cwd: filePathOrDirPath })
    } else {
        return readPkg()
    }
}

/**
 * Return rejected promise if the package name is invalid
 * @param {string} packagePath
 * @param {{verbose:boolean}} options
 * @returns {Promise}
 */
function checkPkgName(packagePath, options) {
    return readPkgWithPath(packagePath).then((pkg) => {
        const name = pkg["name"]
        const result = validateName(name)
        // Treat Legacy Names as valid
        // https://github.com/npm/validate-npm-package-name#legacy-names
        // https://github.com/azu/can-npm-publish/issues/8
        const isInvalidNamingInNewRule = !result.validForNewPackages

        if (isInvalidNamingInNewRule) {
            if (Array.isArray(result.errors)) {
                return Promise.reject(new Error(result.errors.join("\n")))
            }
            // warning is ignored by default
            if (options.verbose && result.warnings) {
                console.warn(result.warnings.join("\n"))
            }
        }
    })
}

/**
 * Return rejected promise if the package is not `private:true`
 * @param {string} packagePath
 * @returns {Promise}
 */
const checkPrivateField = (packagePath) => {
    return readPkgWithPath(packagePath).then((pkg) => {
        if (pkg["private"] === true) {
            return Promise.reject(new Error("This package is private."))
        }
    })
}

/**
 * Return Promise which resolves with an array of version numbers for the package
 * or rejects if anything failed
 * @param packageName
 * @param registry
 * @param {{verbose : boolean}} options
 * @returns {Promise}
 */
function viewPackage(packageName, registry, options) {
    return new Promise((resolve, reject) => {
        const registryArgs = registry ? ["--registry", registry] : []
        const view = spawn("npm", ["view", packageName, "versions", "--json"].concat(registryArgs))
        let _stdoutResult = ""
        let _stderrResult = ""

        /**
         * @param stdout
         * @param stderr
         * @returns {{stdoutJSON: null | {}, stderrJSON: null | {}}}
         */
        const getJsonOutputs = ({ stdout, stderr }) => {
            let stdoutJSON = null
            let stderrJSON = null

            if (stdout) {
                try {
                    stdoutJSON = JSON.parse(stdout)
                } catch (error) {
                    // nope
                    if (options.verbose) {
                        console.error("stdoutJSON parse error", stdout)
                    }
                }
            }
            if (stderr) {
                try {
                    stderrJSON = JSON.parse(stderr)
                } catch (error) {
                    // nope
                    if (options.verbose) {
                        console.error("stderrJSON parse error", stdout)
                    }
                }
            }
            return {
                stdoutJSON,
                stderrJSON
            }
        }

        const isError = (json) => {
            return json && "error" in json
        }

        const is404Error = (json) => {
            return isError(json) && json.error.code === "E404"
        }

        view.stdout.on("data", (data) => {
            _stdoutResult += data.toString()
        })

        view.stderr.on("data", (err) => {
            const stdErrorStr = err.toString()
            const jsonObject = extractJSONObject(stdErrorStr)
            if (jsonObject) {
                _stderrResult = JSON.stringify(jsonObject, null, 4)
            }
        })

        view.on("close", (code) => {
            const { stdoutJSON, stderrJSON } = getJsonOutputs({
                stdout: _stdoutResult,
                stderr: _stderrResult
            })

            if (options.verbose) {
                console.log("`npm view` command's exit code:", code)
                console.log("`npm view` stdoutJSON", stdoutJSON)
                console.log("`npm view` stderrJSON", stderrJSON)
            }

            if (is404Error(stdoutJSON)) {
                return resolve([])
            }
            // npm7 view --json output to stderr if the package is 404 → can publish
            if (is404Error(stderrJSON)) {
                return resolve([])
            }
            // in other error, can not publish → reject
            if (isError(stdoutJSON)) {
                return reject(new Error(_stdoutResult))
            }
            if (isError(stderrJSON)) {
                return reject(new Error(_stderrResult))
            }
            // if command is failed by other reasons(no json output), treat it as actual error
            if (code !== 0) {
                return reject(new Error(_stderrResult))
            }
            if (stdoutJSON) {
                // if success to get, resolve with versions json
                return resolve(stdoutJSON)
            } else {
                return reject(_stderrResult)
            }
        })
    })
}

/**
 *
 * @param {string} packagePath
 * @param {{verbose : boolean}} options
 * @returns {Promise<readPkg.NormalizedPackageJson>}
 */
function checkAlreadyPublish(packagePath, options) {
    return readPkgWithPath(packagePath).then((pkg) => {
        const name = pkg["name"]
        const version = pkg["version"]
        const publishConfig = pkg["publishConfig"]
        const registry = publishConfig && publishConfig["registry"]

        if (name === undefined) {
            return Promise.reject(new Error("This package has no `name`."))
        }
        if (version === undefined) {
            return Promise.reject(new Error("This package has no `version`."))
        }

        return viewPackage(name, registry, options).then((versions) => {
            if (versions.includes(version)) {
                return Promise.reject(new Error(`${name}@${version} is already published`))
            }
            return
        })
    })
}

/**
 *
 * @param {string} packagePath
 * @param {{verbose : boolean}} options
 * @returns {Promise<[any]>}
 */
function canPublish(packagePath, options = { verbose: false }) {
    return Promise.all([
        checkPkgName(packagePath, options),
        checkAlreadyPublish(packagePath, options),
        checkPrivateField(packagePath)
    ])
}

function getDependencies(type, key) {
    const types = ["dependencies", "devDependencies", "peerDependencies"]
    let dependencies = helpers.getRootPackage()[types[type] ?? "dependencies"] ?? {}

    if (typeof key !== "undefined") {
        return dependencies[key]
    }
    return dependencies
}

async function install(dependency, options = {}) {
    if (typeof options.agent === "undefined") {
        options.agent = "npm"
    }

    if (typeof agents[options.agent] === "undefined") {
        throw new Error(`Agent [${options.agent}] is not available`)
    }

    try {
        let outStr = String(`Installing dependency [${dependency}]`)

        runtime.logger.dump("info", outStr)
        runtime.logger.warn(outStr)

        await agents[options.agent]("install", dependency, options, (code, error) => {            
            if (error) {
                runtime.logger.dump("error", error)
                runtime.logger.error(`Error installing dependency [${dependency}] > ${error.message}`)
            } else {
                outStr = `Dependency successfully installed [${dependency}]`

                runtime.logger.dump("info", outStr)
                runtime.logger.log(outStr)
            }
        })
    } catch (error) {
        runtime.logger.dump("error", err)
        runtime.logger.error(`Failed when trying to install dependency [${dependency}] > ${err.message}`)
    }
}

function set(dependency, version = "latest", type = "dependencies") {
    let packageJson = helpers.getRootPackage()

    if (!dependenciesTypes.includes(type)) {
        type = "dependencies"
    }

    if (version === "latest") {
        version = lastVersionSync(dependency)
    }

    packageJson[type][dependency] = version
    write(packageJson)
}

function del(dependency, prune, options, callback) {
    let packageJson = helpers.getRootPackage()

    dependenciesTypes.forEach((type) => {
        if (typeof packageJson[type] !== "undefined") {
            delete packageJson[type][dependency]
        }
    })

    if (prune) {
        agents["npm"]("uninstall", dependency, options, (err) => {
            if (typeof callback === "function") {
                callback(err)
            }

            let outStr = null

            if (err) {
                runtime.logger.dump("error", err)
                console.error(`Error uninstalled dependency [${dependency}] > ${err.message}`)
            } else {
                outStr = `Dependency successfully uninstalled [${dependency}]`

                runtime.logger.dump("info", outStr)
                console.log(outStr)
            }
        })
    }

    write(packageJson)
}

async function npmPublish(packagePath, config) {
    const controller = new npmPublishLib.PublishController()

    if (config.fast) {
        controller.publish({ cwd: packagePath, ...config })
        return true
    } else {
        return controller.publish({ cwd: packagePath, ...config })
    }
}

module.exports = {
    npmPublish,
    viewPackage,
    checkAlreadyPublish,
    canPublish,
    getDependencies,
    install,
    set,
    del,
    check,
    lastVersion,
    lastVersionSync,
}