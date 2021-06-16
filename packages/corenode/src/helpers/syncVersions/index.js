import path from 'path'
import fs from 'fs'

import getVersion from '../getVersion'
import getPackages from '../getPackages'
import { verbosity } from '@corenode/utils'

/**
 * Sync package version from global project version
 * @function syncVersions 
 * @param {string} dir Directory
 */
export function syncVersions(dir) {
    let directories = []
    const currentVersion = getVersion()

    function fail(pkg, error) {
        verbosity.options({ time: false }).log(`[${pkg}] ❌ Error syncing ! > ${error}`)
    }
    function success(pkg) {
        verbosity.options({ time: false }).log(`[${pkg}] ✅ New version synchronized`)
    }

    if (typeof dir !== 'string') {
        const packages = getPackages()

        if (Array.isArray(packages)) {
            directories = packages.map((pkg) => {
                return path.resolve(process.cwd(), `packages/${pkg}`)
            })
        } else {
            directories.push(process.cwd())
        }
    }

    directories.forEach((dir) => {
        try {
            sync(dir, currentVersion)
            success(dir)
        } catch (error) {
            fail(dir, error)
        }
    })
}

function sync(dir, to) {
    const pkgJSONPath = path.resolve(dir, './package.json')

    if (fs.existsSync(dir)) {
        if (fs.existsSync(pkgJSONPath)) {
            let pkg = require(pkgJSONPath)
            pkg.version = to

            if (typeof (pkg["dependencies"]) !== "undefined" && typeof (global._env.development?.headPackage) !== "undefined") {
                Object.keys(pkg["dependencies"]).forEach((name) => {
                    if (name.startsWith(`@${global._env.development?.headPackage}`)) {
                        pkg["dependencies"][name] = to
                    }
                })
            }

            process.runtime.logger.dump("info", `sync versions on package.json [${dir}] > ${pkgJSONPath}`)
            fs.writeFileSync(pkgJSONPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
        }
    }
}

export default syncVersions