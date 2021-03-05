import path from 'path'
import process from 'process'
import fs from 'fs'

let { objectToArrayMap, verbosity, readRootDirectorySync } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })

/**
 * Get parsed version of package
 * @function getVersion
 * @param {boolean} [engine = false] Return version of nodecore
 * @returns {string} proyectRuntime
 */
export function getVersion(engine) {
    const proyectRuntime = global._env
    const enginePkgPath = global._packages._engine
    const proyectPkgPath = global._packages._proyect
    try {
        const pkgEngine = fs.existsSync(enginePkgPath) ? require(enginePkgPath) : {}
        const pkgProyect = fs.existsSync(proyectPkgPath) ? require(proyectPkgPath) : {}

        if (engine && typeof (pkgEngine["version"]) !== "undefined") {
            return pkgEngine["version"]
        }

        if (proyectRuntime.version) {
            return proyectRuntime.version
        }

        if (typeof (pkgProyect["version"]) !== "undefined") {
            return pkgProyect["version"]
        }
    } catch (error) {
        // terrible
        return false
    }
    return false
}

/**
 * Get the entire runtime enviroment 
 * @function getProyectEnv 
 * @returns {object} proyectRuntime
 */
export function getProyectEnv() {
    return global._env
}

/**
 * Get `originGit` from `.nodecore` env 
 * @function getGit 
 * @returns {string} originGit
 */
export function getGit() {
    const envs = getProyectEnv().devRuntime
    if (!envs || typeof (envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}

/**
 * Get all packages from current proyect
 * @function getPackages 
 * @param {boolean} [params.fullPath = false] Return array with full path to packages
 * @returns {array} Packages names
 */
export function getPackages(params) {
    return readRootDirectorySync("packages", params)
}

/**
 * Get all dependent modules from current proyect
 * @function getInstalledNodeModules 
 * @param {boolean} [params.fullPath = false] Return array with full path to packages
 * @returns {array} Packages names
 */
export function getInstalledNodeModules(params) {
    return readRootDirectorySync("node_modules", params)
}

/**
 * Get all nodecore dependencies installed
 * @function getInstalledNodecoreDependencies 
 * @param {boolean} [params.fullPath = false] Return array with full path to packages
 * @returns {array} Packages names
 */
export function getInstalledNodecoreDependencies(params) {
    return readRootDirectorySync("node_modules/@nodecorejs", params)
}

/**
 * Get proyect package.json
 * @function getRootPackage 
 * @returns {object}
 */
export function getRootPackage() {
    const proyectPkgPath = global._packages._proyect

    if (fs.existsSync(proyectPkgPath)) {
        return require(proyectPkgPath)
    }
    return false
}

/**
 * Check if the current proyect is on local mode
 * @function isLocalMode 
 * @returns {boolean}
 */
export function isLocalMode() {
    return getRootPackage().name === "nodecorejs"
}

/**
 * Check if the current proyect is on development mode
 * @function isDevMode 
 * @returns {boolean}
 */
export function isDevMode() {
    return fs.existsSync(path.resolve(process.cwd(), './.dev'))
}

/**
 * Check if the current proyect is on proyect mode
 * @function isProyectMode 
 * @param {string} [dir = undefined] Check from custom directory instead default proyect path
 * @returns {boolean}
 */
export function isProyectMode(dir) {
    const from = dir ?? process.cwd()
    const packagesDir = path.resolve(from, './packages')

    if (fs.existsSync(packagesDir)) {
        if (fs.readdirSync(packagesDir)) {
            return true
        }
        return false
    }

    return false
}

/**
 * Check if an dependecy is installed on current proyect
 * @function isDependencyInstalled 
 * @param name Package name
 * @returns {boolean}
 */
export function isDependencyInstalled(name) {
    const currentPackages = getRootPackage().dependencies ?? {}
    return currentPackages[name] ?? false
}

export function modifyRuntimeEnv(mutation) {
    // TODO: modifyRuntimeEnv
}

/**
 * Add an dependecy to package of the current proyect
 * @function addDependency
 * @param dependency.key NPM Package name
 * @param dependency.value NPM Package version
 * @param [write = false] Write to package.json
 * @returns {object} Updated package.json
 */

// TODO: Support append to devDependencies
export function addDependency(dependency, write = false) {
    const proyectPkgPath = global._packages._proyect

    let packageJSON = getRootPackage() ?? {}
    packageJSON.dependencies[dependency.key] = dependency.value

    if (write) {
        fs.writeFileSync(proyectPkgPath, JSON.stringify(packageJSON, null, 2) + '\n', 'utf-8')
    }
    return packageJSON
}

/**
 * Stringify an parsed version to readable string
 * @function versionToString 
 * @param {object} version
 * @returns {string}
 */
export function versionToString(version) {
    let v = []
    objectToArrayMap(version).forEach(element => {
        if (typeof (element.value) !== "undefined" && element.value != null) {
            v[global.versionScheme[element.key]] = element.value
        }
    })
    return v.join('.')
}

/**
 * Bumps current version of the current proyect
 * @function bumpVersion 
 * @param {array} params "major", "minor", "patch"
 * @param {array} silent Suppres console
 * @param {boolean} [save = false] Force to save updated version to currect proyect
 */
export function bumpVersion(params, save, options) {
    if (!params) {
        return false
    }
    const bumps = [
        {
            type: "major",
            do: () => {
                currentVersion.major = currentVersion.major + 1
                currentVersion.minor = 0
                currentVersion.patch = 0
            }
        },
        {
            type: "minor",
            do: () => {
                currentVersion.minor = currentVersion.minor + 1
                currentVersion.patch = 0
            }
        },
        {
            type: "patch",
            do: () => {
                currentVersion.patch = currentVersion.patch + 1
            }
        },
    ]

    bumps.forEach(bump => {
        if (params.includes(bump.type)) {
            if (typeof (bump.do) == "function") {
                bump.do()
            }
        }
    })

    let before = getVersion()
    let after = versionToString(currentVersion)

    options?.silent ? null : console.log(`\n🏷 New version ${before} > ${after}`)
    if (save) {
        options?.silent ? null : console.log(`✅ Version updated & saved`)
        global._env.version = after
        return rewriteRuntimeEnv()
    }
}

/**
 * Sync package version from global proyect version to one package
 * @function syncPackageVersionFromName 
 * @param {object} name Package name
 * @param {boolean} [write = false] Force to write updated to defined package
 * @returns {object} Package with syncronised version
 */
export function syncPackageVersionFromName(name, write) {
    const currentVersion = getVersion()
    const packageDir = path.resolve(process.cwd(), `./packages/${name}`)
    const pkgJSONPath = path.resolve(packageDir, './package.json')

    if (fs.existsSync(packageDir) && fs.existsSync(pkgJSONPath)) {
        let pkg = require(pkgJSONPath)
        if (pkg) {
            pkg.version = currentVersion

            if (typeof (pkg["dependencies"]) !== "undefined" && typeof (global._env.devRuntime?.headPackage) !== "undefined") {
                Object.keys(pkg["dependencies"]).forEach((name) => {
                    // TODO: Support multiple packages
                    // TODO: Support packagejson fallback if not `devRuntime.headPackage` is available
                    if (name.startsWith(`@${global._env.devRuntime?.headPackage}`)) {
                        pkg["dependencies"][name] = currentVersion
                    }
                })
            }

            if (write) {
                verbosity.dump(`writting update version on package [${name}] > ${pkgJSONPath} > ${JSON.stringify(pkg)}`)
                fs.writeFileSync(pkgJSONPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
            }

            return pkg
        }

    }
}

/**
 * Syncs all packages from current proyect with the global proyect version
 * @function syncAllPackagesVersions 
 */
export function syncAllPackagesVersions() {
    const pkgs = getPackages()
    pkgs.forEach((pkg) => {
        try {
            syncPackageVersionFromName(pkg, true)
            verbosity.options({ dumpFile: true }).log(`[${pkg}] ✅ New version synchronized`)
        } catch (error) {
            verbosity.options({ dumpFile: true }).log(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}

function rewriteRuntimeEnv() {
    verbosity.dump(`Rewrited runtime env > ${global._packages._env}`)
    return fs.writeFileSync(global._envpath, JSON.stringify(global._env, null, 2) + '\n', 'utf-8')
}