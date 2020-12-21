// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
import path from 'path'
import process from 'process'
import fs from 'fs'
import { IRuntimeEnv } from './types'
import { objectToArrayMap, verbosity } from '@nodecorejs/utils'

const enginePkgPath = path.resolve(__filename, '../../package.json')
const proyectPkgPath = path.resolve(process.cwd(), './package.json')

let versionOrderScheme = {
    mayor: 0,
    minor: 1,
    patch: 2
}

let currentVersion = {}
const versionsTypes = Object.keys(versionOrderScheme)

let proyectRuntimePath = path.resolve(process.cwd(), '.nodecore') // For this repo only watch .nodecore
let proyectRuntime = <IRuntimeEnv>{}

let _envDone = false
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

        objectToArrayMap(getVersion().split('.')).forEach((entry: any) => {
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

// Functions
export function getVersion(engine?: boolean) {
    const pkgEngine = require(enginePkgPath)
    const pkgProyect = require(proyectPkgPath)

    if (engine && typeof(pkgEngine["version"]) !== "undefined") {
        return pkgEngine["version"]
    }
    
    if (proyectRuntime.version) {
        return proyectRuntime.version
    } 

    if (typeof(pkgProyect["version"]) !== "undefined") {
        return pkgProyect["version"]
    }

    return "0.0.0"
}

export const getRuntimeEnv = () => {
    return proyectRuntime
}

export const getDevRuntimeEnv: any = () => {
    if (!proyectRuntime || typeof (proyectRuntime.devRuntime) == "undefined") {
        return false
    }
    return proyectRuntime.devRuntime
}

export const getGit = () => {
    const envs = getDevRuntimeEnv()
    if (!envs || typeof (envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}

export function getPackages() {
    const packagesDir = path.resolve(process.cwd(), './packages')
    if (fs.existsSync(packagesDir)) {
        return fs.readdirSync(packagesDir).filter(
            (pkg) => pkg.charAt(0) !== '.',
        )
    }
    return false
}

export function getRootPackage() {
    if (fs.existsSync(proyectPkgPath)) {
        return require(proyectPkgPath)
    }
    return false
}

export function isLocalMode() {
    return fs.existsSync(path.resolve(process.cwd(), './.local'))
}

// Scripts Functions
export function versionToString(version: any) {
    let v: any = []
    objectToArrayMap(version).forEach(element => {
        if (typeof (element.value) !== "undefined" && element.value != null) {
            v[versionOrderScheme[element.key]] = element.value
        }
    })
    return v.join('.')
}

export function bumpVersion(params: any, confirmation: boolean) {
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

    console.log(`\n🏷 New version ${before} > ${after} \t(For overwrite the current version use --save)`)
    if (confirmation) {
        console.log(`✅ Version updated`)
        proyectRuntime.version = after
        return rewriteRuntimeEnv()
    }
}

export function syncPackageVersionFromName(name: string, write?: boolean) {
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
                } else {
                    console.log(pkg)
                    return pkg
                }
            }
        }

    }
}

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
    return fs.writeFileSync(proyectRuntimePath, JSON.stringify(proyectRuntime, null, 2) + '\n', 'utf-8')
}

export default proyectRuntime