// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
import path from 'path'
import process from 'process'
import getPackages from './utils/getPackages'
import fs from 'fs'
import bootstrap from './bootstrap'
import { IRuntimeEnv, IPackageJSON } from './types'

const rootPackageJSON = path.resolve(process.cwd(), './package.json')
const versionFile = path.resolve(process.cwd(), './.version')
const findenvs = require('find-up').sync(syncEnvs)

export let version: string
export let parsedVersion: any = {
    major: 0,
    minor: 0,
    patch: 0
}
let runtimeEnv = <IRuntimeEnv>{}

if(findenvs){
    try {
        // @ts-ignore
        runtimeEnv = JSON.parse(fs.readFileSync(findenvs))
    } catch (error) {
        console.log("Failed trying load runtime env")
        // (⓿_⓿) terrible...
    }
}else{
    console.log("Runtime env (.nodecore) is missing")
}

try {   //init from runtime
    if (!fs.existsSync(versionFile)) {
        console.log(`.version file not exist, creating...`)
        fs.writeFileSync(versionFile, rootPackageJSON.version)
    }
    version = fs.readFileSync(versionFile, 'utf8')

    const args = process.argv.slice(2);
    const parsed = version.split('.')

    parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
    parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
    parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0

}

export const bootstrapProyect = () => {
    return bootstrap()
}

export const getWachtedEnv = () => {
    return syncEnvs
}

export const getRuntimeEnv = () => {
    return runtimeEnv
}

export const getDevRuntimeEnvs: any = () => {
    if (!runtimeEnv || typeof(runtimeEnv.devRuntime) == "undefined") {
        return false
    }

    return runtimeEnv.devRuntime
}

export const getGit = () => {
    const envs = getDevRuntimeEnvs()
    if (!envs || typeof(envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}

export const getrootPackageJSON = () => {
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

export function parsedVersionToString(version) {
    return `${version.major}.${version.minor}.${version.patch}`
}

export function getVersion() {
    return version
}

export function updateVersion(to) {
    if (!to) {
        return false
    }
    let updated

    if (typeof (to) == "object") {
        updated = parsedVersionToString(to)
    } else {
        const parsed = to.split('.')
        parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
        parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
        parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0

        updated = parsedVersionToString(parsedVersion)
    }

    console.log(`✅ Version updated to > ${updated}`)
    return fs.writeFileSync(versionFile, updated)
}

export function bumpVersion(params) {
    const bumps = {
        major: params.includes("major"),
        minor: params.includes("minor"),
        patch: params.includes("patch"),
    }

    if (bumps.major) {
        parsedVersion.major = parsedVersion.major + 1
        parsedVersion.minor = 0
        parsedVersion.path = 0
    }
    if (bumps.minor) {
        parsedVersion.minor = parsedVersion.minor + 1
        parsedVersion.path = 0
    }
    if (bumps.patch) {
        parsedVersion.patch = parsedVersion.patch + 1
    }

    function bumpTable(major, minor, patch) {
        this.major = major ? parsedVersion.major : false;
        this.minor = minor ? parsedVersion.minor : false;
        this.patch = patch ? parsedVersion.patch : false;
    }
    console.table(new bumpTable(bumps.major, bumps.minor, bumps.patch));

    return updateVersion(parsedVersion)
}

export function syncPackagesVersions() {
    const pkgs = getPackages()
    pkgs.forEach((pkg) => {
        try {
            const pkgFilePath = path.resolve(process.cwd(), `./packages/${pkg}/package.json`)
            if (!fs.existsSync(pkgFilePath)) {
                console.log(`[${pkg}] ❌ This package is not bootstraped! > package.json not found. > Run npm run bootstrap for init this package.`)
                return false
            }
            const pkgFile = JSON.parse(fs.readFileSync(pkgFilePath, 'utf8'))
            if (pkgFile.version !== version) {
                console.log(`[${pkg}] ✅ New version synchronized`)
                return fs.writeFileSync(pkgFilePath, version)
            }
            console.log(`[${pkg}] 💠 Version is synchronized, no changes have been made...`)
        } catch (error) {
            console.error(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}

export default runtimeEnv