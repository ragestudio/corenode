import path from 'path'
import process from 'process'
import fs from 'fs'

let { schemizedStringify, schemizedParse, verbosity, readRootDirectorySync } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })

/**
 * Get parsed version of package
 * @function getVersion
 * @param {object} opts
 * @param {object} opts.engine Return
 * @returns {string} projectRuntime
 */
export function getVersion(opts) {
    let version = "0.0.0"

    const projectRuntime = global._env
    const enginePkgPath = global._packages._engine
    const projectPkgPath = global._packages._project

    try {
        const pkgEngine = fs.existsSync(enginePkgPath) ? require(enginePkgPath) : {}
        const pkgProject = fs.existsSync(projectPkgPath) ? require(projectPkgPath) : {}
        
        if (opts?.engine) {
            version = pkgEngine["version"] ?? "0.0.0"
        } else {
            if (projectRuntime.version) {
                version = projectRuntime.version
            } else if (typeof (pkgProject["version"]) !== "undefined") {
                version = pkgProject["version"]
            }
        }
    } catch (error) {
        // terrible
    }
    return version
}

/**
 * Get the entire runtime enviroment 
 * @function getProjectEnv 
 * @returns {object} projectRuntime
 */
export function getProjectEnv() {
    return global._env
}

/**
 * Get `originGit` from `.corenode` env 
 * @function getGit 
 * @returns {string} originGit
 */
export function getGit() {
    const envs = getProjectEnv().devRuntime
    if (!envs || typeof (envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}

/**
 * Get all packages from current project
 * @function getPackages 
 * @param {boolean} [params.fullPath = false] Return array with full path to packages
 * @returns {array} Packages names
 */
export function getPackages(params) {
    return readRootDirectorySync("packages", params)
}

/**
 * Get all dependent modules from current project
 * @function getInstalledDependencies 
 * @param {boolean} [params.fullPath = false] Return array with full path to packages
 * @returns {array} Packages names
 */
export function getInstalledDependencies(params) {
    return readRootDirectorySync("node_modules", params)
}

/**
 * Get project package.json
 * @function getRootPackage 
 * @returns {object}
 */
export function getRootPackage() {
    const projectPkgPath = global._packages?._project

    if (projectPkgPath && fs.existsSync(projectPkgPath)) {
        return require(projectPkgPath)
    }

    return false
}

/**
 * Check if the current project is corenode
 * @function isCorenodeProject 
 * @returns {boolean}
 */
export function isCorenodeProject() {
    return getRootPackage().name === "corenode"
}

/**
 * Check if the current project is on development mode
 * @function isDevMode 
 * @returns {boolean}
 */
export function isDevMode() {
    return fs.existsSync(path.resolve(process.cwd(), './.dev'))
}

/**
 * Check if the current project is on project mode
 * @function isProjectMode 
 * @param {string} [dir = undefined] Check from custom directory instead default project path
 * @returns {boolean}
 */
export function isProjectMode(dir) {
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

export function modifyRuntimeEnv(mutation) {
    // TODO: modifyRuntimeEnv
}

/**
 * Check if an dependecy is installed on current project
 * @function isDependencyInstalled 
 * @param name Package name
 * @returns {boolean}
 */
export function isDependencyInstalled(name) {
    const currentPackages = getRootPackage().dependencies ?? {}
    return currentPackages[name] ?? false
}

/**
 * Add an dependecy to package of the current project
 * @function addDependency
 * @param dependency.key NPM Package name
 * @param dependency.value NPM Package version
 * @param [write = false] Write to package.json
 * @returns {object} Updated package.json
 */

// TODO: Support append to devDependencies
export function addDependency(dependency, write = false) {
    const projectPkgPath = global._packages._project

    let packageJSON = getRootPackage() ?? {}
    packageJSON.dependencies[dependency.key] = dependency.value

    if (write) {
        fs.writeFileSync(projectPkgPath, JSON.stringify(packageJSON, null, 2) + '\n', 'utf-8')
    }
    return packageJSON
}

/**
 * Bumps current version of the current project
 * @function bumpVersion 
 * @param {array} params "major", "minor", "patch"
 * @param {boolean} [save = false] Force to save updated version to currect project
 */
export function bumpVersion(params) {
    if (!params) return false

    const version = getVersion()
    const parsedVersion = schemizedParse(version, global._versionScheme, '.')

    const bumps = [
        {
            type: "major",
            do: () => {
                parsedVersion.major = parsedVersion.major + 1
                parsedVersion.minor = 0
                parsedVersion.patch = 0
            }
        },
        {
            type: "minor",
            do: () => {
                parsedVersion.minor = parsedVersion.minor + 1
                parsedVersion.patch = 0
            }
        },
        {
            type: "patch",
            do: () => {
                parsedVersion.patch = parsedVersion.patch + 1
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

    const after = schemizedStringify(parsedVersion, global._versionScheme, '.')
    console.log(`🏷 Updated to new version ${after} > before ${version}`)

    global._env.version = after

    return rewriteRuntimeEnv()
}

/**
 * Sync package version from global project version to one package
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
 * Syncs all packages from current project with the global project version
 * @function syncAllPackagesVersions 
 */
export function syncAllPackagesVersions() {
    const pkgs = getPackages()
    pkgs.forEach((pkg) => {
        try {
            syncPackageVersionFromName(pkg, true)
            verbosity.options({ dumpFile: true, method: false, time: false }).log(`[${pkg}] ✅ New version synchronized`)
        } catch (error) {
            verbosity.options({ dumpFile: true, method: false, time: false }).log(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}

function rewriteRuntimeEnv() {
    verbosity.options({ dumpFile: true, time: false, method: false }).warn(`Runtime environment rewrited > ${global._envpath}`)
    return fs.writeFileSync(global._envpath, JSON.stringify(global._env, null, 2) + '\n', 'utf-8')
}