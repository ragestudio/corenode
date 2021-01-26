/**
 * Nodecore runtime utils & functions
 * @module @nodecorejs/dot-runtime 
 * @return {object} proyectRuntime
 */

import path from 'path'
import process from 'process'
import fs from 'fs'
import { objectToArrayMap, verbosity } from '@nodecorejs/utils'

let versionOrderScheme = { mayor: 0, minor: 1, patch: 2 }
let currentVersion = {}

let proyectRuntimePath = path.resolve(process.cwd(), '.nodecore') // For this repo only watch .nodecore
let proyectRuntime = {}
let _envDone = false

const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
const versionsTypes = Object.keys(versionOrderScheme)
const enginePkgPath = path.resolve(__filename, '../../package.json')
export const proyectPkgPath = path.resolve(process.cwd(), './package.json')

//  INIT RUNTIME FUNTIONS
class Globals {
    constructor(globals) {
        this.Allocations = globals ?? []
        this.init()
    }

    init() {
        if (Array.isArray(this.Allocations)) {
            this.Allocations.forEach((_global) => {
               this.allocate(_global)
            })
        }
    }
    
    allocate(name, payload) {
        if (global[name] != null) {
            return true
        }
        return global[name] = payload ?? {}
    }
}

export const RuntimeGlobals = new Globals(["nodecore_cli", "nodecore"])

syncEnvs.forEach(runtime => {
    if (!_envDone) {
        const fromPath = path.resolve(process.cwd(), `./${runtime}`)
        if (fs.existsSync(fromPath)) {
            proyectRuntimePath = fromPath
            try {
                const parsed = JSON.parse(fs.readFileSync(fromPath))
                proyectRuntime = parsed
                _envDone = true
            } catch (error) {
                console.log(error)
                // failed to load this runtime
            }
        }
    }
})

if (proyectRuntime["version"]) {
    try {
        versionsTypes.forEach((type) => {
            currentVersion[type] = null
        })

        objectToArrayMap(getVersion().split('.')).forEach((entry) => {
            let entryValue = null

            if (isNaN(Number(entry.value))) {
                entryValue = entry.value
            } else {
                entryValue = Number(entry.value)
            }

            if (entryValue != null) {
                currentVersion[versionsTypes[entry.key]] = entryValue
            }
        })

    } catch (error) {
        verbosity.log("🆘 Failed trying load nodecore runtime environment version")
        verbosity.log(error)
    }
}



//  Nodecore Libraries

/**
 * Get parsed version of package
 * @param {boolean} [engine = false] Return version of nodecore
 * @function getVersion 
 * @returns {string} proyectRuntime
 */
export function getVersion(engine) {
    const pkgEngine = require(enginePkgPath)
    const pkgProyect = require(proyectPkgPath)

    if (engine && typeof (pkgEngine["version"]) !== "undefined") {
        return pkgEngine["version"]
    }

    if (proyectRuntime.version) {
        return proyectRuntime.version
    }

    if (typeof (pkgProyect["version"]) !== "undefined") {
        return pkgProyect["version"]
    }

    return "0.0.0"
}

/**
 * Get the entire runtime enviroment 
 * @function getRuntimeEnv 
 * @returns {object} proyectRuntime
 */
export function getRuntimeEnv() {
    return proyectRuntime
}

/**
 * Get development runtime enviroment 
 * @function getDevRuntimeEnv 
 * @returns {object} devRuntime
 */
export function getDevRuntimeEnv() {
    if (!proyectRuntime || typeof (proyectRuntime.devRuntime) == "undefined") {
        return false
    }
    return proyectRuntime.devRuntime
}

/**
 * Get `originGit` from `.nodecore` env 
 * @function getGit 
 * @returns {string} originGit
 */
export function getGit() {
    const envs = getDevRuntimeEnv()
    if (!envs || typeof (envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}

/**
 * Get all packages name from current proyect
 * @function getPackages 
 * @returns {object}
 */
export function getPackages() {
    const packagesDir = path.resolve(process.cwd(), './packages')
    if (fs.existsSync(packagesDir)) {
        return fs.readdirSync(packagesDir).filter(
            (pkg) => pkg.charAt(0) !== '.',
        )
    }
    return false
}

/**
 * Get proyect package.json
 * @function getRootPackage 
 * @returns {object}
 */
export function getRootPackage() {
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
    return fs.existsSync(path.resolve(process.cwd(), './.local'))
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
 * Check if the current proyect is on development mode
 * @function isLocalMode 
 * @returns {boolean}
 */
export function isDevMode() {
    return fs.existsSync(path.resolve(process.cwd(), './.dev'))
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

// TODO: modifyRuntimeEnv
export function modifyRuntimeEnv(mutation) {
    
}

/**
 * Add an dependecy to package of the current proyect
 * @function addDependency
 * @param dependency.key NPM Package name
 * @param dependency.value NPM Package version
 * @param [write = false] Write to package.json
 * @returns {object} Updated package.json
 */
export function addDependency(dependency, write = false) {
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
            v[versionOrderScheme[element.key]] = element.value
        }
    })
    return v.join('.')
}

/**
 * Bumps current version of the current proyect
 * @function bumpVersion 
 * @param {array} params "major", "minor", "patch"
 * @param {boolean} [save = false] Force to save updated version to currect proyect
 */
export function bumpVersion(params, save) {
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

    console.log(`\n🏷 New version ${before} > ${after}`)
    if (save) {
        console.log(`✅ Version updated & saved`)
        proyectRuntime.version = after
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
    const pkgJSON = path.resolve(packageDir, './package.json')

    if (fs.existsSync(packageDir) && fs.existsSync(pkgJSON)) {
        let pkg = require(pkgJSON)
        if (pkg) {
            pkg.version = currentVersion
            if (typeof (pkg["dependencies"]) !== "undefined") {
                Object.keys(pkg["dependencies"]).forEach((name) => {
                    // TODO: Support packagejson fallback if not `devRuntime.headPackage` is available
                    if (name.startsWith(`@${proyectRuntime.devRuntime.headPackage}`)) {
                        pkg["dependencies"][name] = currentVersion
                    }
                })
                if (write) {
                    fs.writeFileSync(pkgJSON, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
                }

                return pkg
            }
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
            verbosity.log(`[${pkg}] ✅ New version synchronized`)
        } catch (error) {
            verbosity.log(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}

function rewriteRuntimeEnv() {
    verbosity.log(`Rewrited runtime env > ${proyectRuntimePath}`)
    return fs.writeFileSync(proyectRuntimePath, JSON.stringify(proyectRuntime, null, 2) + '\n', 'utf-8')
}

export default proyectRuntime