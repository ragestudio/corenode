// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
import path from 'path'
import process from 'process'
import fs from 'fs'
import bootstrap from './bootstrap'
import { IRuntimeEnv } from './types'
import { objectToArrayMap } from '@nodecorejs/utils'

const rootPackageJSON = path.resolve(process.cwd(), './package.json')
const versionFile = path.resolve(process.cwd(), './.version')
const findenvs = require('find-up').sync(syncEnvs)

let versionOrderScheme = { mayor: 0, minor: 1, patch: 2, stage: 3 }
let version = getVersion()
let currentParsedVersion = {}
const versionsKeys = Object.keys(versionOrderScheme)

let runtimeEnv = <IRuntimeEnv>{}

if (findenvs) {
    try {
        objectToArrayMap(getVersion().split('.')).forEach((entry:any) => {
            currentParsedVersion[versionsKeys[entry.key]] = Number(entry.value)
        })
        // @ts-ignore
        runtimeEnv = JSON.parse(fs.readFileSync(findenvs))
    } catch (error) {
        console.log("Failed trying load runtime env")
        // (⓿_⓿) terrible...
    }
} else {
    console.log("Runtime env (.nodecore) is missing")
}

// Functions
export const bootstrapProyect = () => {
    return bootstrap()
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

export function parsedVersionToString(version: any) {
    let v = []
    objectToArrayMap(version).forEach(element => {
        v[versionOrderScheme[element.key]] = element.value
    })
    console.log(v.join('.'))
    return v.join('.')
}

export function getPackages() {
    return fs.readdirSync(path.join(process.cwd(), './packages')).filter(
        (pkg) => pkg.charAt(0) !== '.',
    );
}

export function getVersion() {
    const versionFilePath = path.resolve(process.cwd(), './.version')
    if (!fs.existsSync(versionFilePath)) {
        console.log(`.version file not exist, creating...`)
        fs.writeFileSync(versionFilePath, rootPackageJSON.version)
    }
    return fs.readFileSync(versionFilePath, 'utf8')
}

export function updateVersion(to: any) {
    if (!to) {
        return false
    }
    let updated = ''

    if (typeof (to) !== "string") {
        currentParsedVersion = { ...currentParsedVersion, ...to } 
        updated = parsedVersionToString(currentParsedVersion)
    } else {
        updated = to
    }

    console.log(`✅ Version updated to > ${updated}`)
    version = updated
    //return fs.writeFileSync(versionFile, updated)
}

export function bumpVersion(params: any) {
    if (!params) {
        return false
    }

    let update: any = {
        major: 0,
        minor: 0,
        patch: 0,
        stage: ""
    }

    const bumps = [
        {
            type: "major",
            do: () => {
                update.major = update.major + 1
                update.minor = 0
                update.path = 0
            }
        },
        {
            type: "minor",
            do: () => {
                update.minor = update.minor + 1
                update.path = 0
            }
        },
        {
            type: "patch",
            do: () => {
                update.patch = update.patch + 1
            }
        },
        {
            type: "nightly",
            do: () => {
                update.stage = "nightly"
            }
        },
        {
            type: "alpha",
            do: () => {
                update.stage = "alpha"
            }
        },
        {
            type: "beta",
            do: () => {
                update.stage = "beta"
            }
        },
    ]

    bumps.forEach(bump => {
        if (params.includes(bump.type)) {
            if (typeof(bump.do) == "function") {
                bump.do()
            }
        }
    })

    return updateVersion(update)
}

export function syncPackagesVersions() {
    const currentVersion = getVersion()
    const pkgs = getPackages()
    pkgs.forEach((pkg) => {
        try {
            const pkgFilePath = path.resolve(process.cwd(), `./packages/${pkg}/package.json`)
            if (!fs.existsSync(pkgFilePath)) {
                console.log(`[${pkg}] ❌ This package is not bootstraped! > package.json not found. > Run npm run bootstrap for init this package.`)
                return false
            }
            let pkgFile = JSON.parse(fs.readFileSync(pkgFilePath, 'utf8'))
            if (pkgFile.version !== currentVersion) {
                console.log(`[${pkg}] ✅ New version synchronized`)
                pkgFile.version = currentVersion
                return fs.writeFileSync(pkgFilePath, JSON.stringify(pkgFile, null, 2) + '\n', 'utf-8')
            }
            console.log(`[${pkg}] 💠 Version is synchronized, no changes have been made...`)
        } catch (error) {
            console.error(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}

export default runtimeEnv