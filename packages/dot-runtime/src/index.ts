// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
import path from 'path'
import process from 'process'
import fs from 'fs'
import bootstrap from './bootstrap'
import { IRuntimeEnv } from './types'
import { objectToArrayMap, verbosity } from '@nodecorejs/utils'

const rootPackageJSON = path.resolve(process.cwd(), './package.json')
const versionFile = path.resolve(process.cwd(), './.version')
const findenvs = require('find-up').sync(syncEnvs)

let versionOrderScheme = {
    mayor: 0,
    minor: 1,
    patch: 2
}

let currentVersion = {}
const versionsTypes = Object.keys(versionOrderScheme)

let runtimeEnv = <IRuntimeEnv>{}

if (findenvs) {
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

            if (entryValue != null && entryValue != NaN) {
                currentVersion[versionsTypes[entry.key]] = entryValue
            }
        })
        // @ts-ignore
        runtimeEnv = JSON.parse(fs.readFileSync(findenvs))
    } catch (error) {
        verbosity.log("🆘 Failed trying load nodecore runtime environment")
        verbosity.log(error)
    }
} else {
    verbosity.log("❌ Nodecore Runtime environment is missing! (.nodecore)")
}

// Functions

export function getVersion() {
    const versionFilePath = path.resolve(process.cwd(), './.version')
    if (!fs.existsSync(versionFilePath)) {
        fs.writeFileSync(versionFilePath, JSON.stringify(rootPackageJSON.version), 'utf-8')
    }
    return fs.readFileSync(versionFilePath, 'utf-8')
}

export const getWachtedEnv = () => {
    return syncEnvs
}

export const getRuntimeEnv = () => {
    return runtimeEnv
}

export const getDevRuntimeEnv: any = () => {
    if (!runtimeEnv || typeof (runtimeEnv.devRuntime) == "undefined") {
        return false
    }
    return runtimeEnv.devRuntime
}

export const getGit = () => {
    const envs = getDevRuntimeEnv()
    if (!envs || typeof (envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}

export function getPackages() {
    return fs.readdirSync(path.join(process.cwd(), './packages')).filter(
        (pkg) => pkg.charAt(0) !== '.',
    );
}

export const getRootPackageJSON = () => {
    if (!rootPackageJSON) {
        return false
    }
    try {
        // @ts-ignore
        const fileStream = JSON.parse(fs.readFileSync(rootPackageJSON))
        if (fileStream) {
            return fileStream
        }
        return false
    } catch (error) {
        return false
    }
}
// Scripts Functions
export const bootstrapProyect = () => {
    return bootstrap()
}

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
        return fs.writeFileSync(versionFile, after)
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
                    if (name.startsWith(`@${runtimeEnv.devRuntime.headPackage}`)) {
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

export default runtimeEnv