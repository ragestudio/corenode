const fs = require("fs")
const execa = require('execa')

const helpers = require('../helpers')
const agents = require('./agents')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const dependenciesTypes = ["dependencies", "devDependencies", "peerDependencies"]

//* HELPERS
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
    const res = await execa.command(`${npmCommand} show ${dependency} version`)
    return res.stdout
}

function lastVersionSync(dependency) {
    const res = execa.commandSync(`${npmCommand} show ${dependency} version`)
    return res.stdout
}

function write(mutation) {
    let data = JSON.parse(fs.readFileSync(global._packages._project, 'utf8'))
    data = { ...data, ...mutation }

    return fs.writeFileSync(global._packages._project, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

//* METHODS
function get(type, key) {
    const types = ["dependencies", "devDependencies", "peerDependencies"]
    let dependencies = helpers.getRootPackage()[(type && types.includes(type) ? type : "dependencies") ?? "dependencies"] ?? {}

    if (typeof key !== "undefined") {
        return dependencies[key]
    }
    return dependencies
}

function install(dependency, options = {}, callback) {
    if (typeof options.agent === "undefined") {
        options.agent = "npm"
    }

    if (typeof agents[options.agent] === "undefined") {
        throw new Error(`Agent [${options.agent}] is not available`)
    }

    agents[options.agent]("install", dependency, options, (err) => {
        if (typeof callback === "function") {
            callback(err)
        }

        let outStr = String()

        if (err) {
            runtime.logger.dump("error", err)
            console.error(`Error installing dependency [${dependency}] > ${err.message}`)
        } else {
            outStr = `Dependency successfully installed [${dependency}]`

            runtime.logger.dump("info", outStr)
            console.log(outStr)
        }
    })
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
    
            let outStr = String()
    
            if (err) {
                runtime.logger.dump("error", err)
                console.error(`Error uninstalled dependency [${dependency}] > ${err.message}`)
            } else {
                outStr = `Dependency sucessfully uninstalled [${dependency}]`
    
                runtime.logger.dump("info", outStr)
                console.log(outStr)
            }
        })
    }
    
    write(packageJson)
}

module.exports = {
    get,
    install,
    set,
    del,
    check,
    lastVersion,
    lastVersionSync
}