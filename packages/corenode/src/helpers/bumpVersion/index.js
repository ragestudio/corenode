import fs from 'fs'
import getVersion from '../getVersion'
import { schemizedParse, schemizedStringify, verbosity } from '@corenode/utils'

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

function rewriteRuntimeEnv() {
    verbosity.options({ time: false, method: false }).warn(`Runtime environment rewrited > ${global.project._envpath}`)
    return fs.writeFileSync(global.project._envpath, JSON.stringify(global._env, null, 2) + '\n', 'utf-8')
}

export default bumpVersion