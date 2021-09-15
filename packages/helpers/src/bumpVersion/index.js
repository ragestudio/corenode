import fs from 'fs'
import getVersion from '../getVersion'
import { schemizedParse, schemizedStringify } from '@corenode/utils'

const versionScheme =  { mayor: 0, minor: 1, patch: 2 }

/**
 * Bumps current version of the current project
 * @function bumpVersion 
 * @param {array} params "major", "minor", "patch"
 * @param {boolean} [save = false] Force to save updated version to currect project
 */
export function bumpVersion(params) {
    if (!params) return false

    let version = getVersion()
    let parsedVersion = schemizedParse(version, versionScheme, '.')

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

    const before = version

    version = schemizedStringify(parsedVersion, versionScheme, '.')
    global._env.version = version

    console.log(`🏷 Version updated! [${before} > ${version}]`)

    return updateEnv({
        version: version,
    })
}

function updateEnv(mutation) {
    let pkg = JSON.parse(fs.readFileSync(process.runtime.manifests.project, 'utf8'))
    let data = JSON.parse(fs.readFileSync(process.runtime.project._envpath, 'utf8'))

    pkg = { ...pkg, ...mutation }
    data = { ...data, ...mutation }

    fs.writeFileSync(process.runtime.manifests.project, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    fs.writeFileSync(process.runtime.project._envpath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

export default bumpVersion