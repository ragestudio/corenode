import path from 'path'
import fs from 'fs'

import getVersion from '../getVersion'

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

            if (typeof (pkg["dependencies"]) !== "undefined" && typeof (global._env.development?.headPackage) !== "undefined") {
                Object.keys(pkg["dependencies"]).forEach((name) => {
                    // TODO: Support multiple packages
                    // TODO: Support packagejson fallback if not `development.headPackage` is available
                    if (name.startsWith(`@${global._env.development?.headPackage}`)) {
                        pkg["dependencies"][name] = currentVersion
                    }
                })
            }

            if (write) {
                process.runtime.logger.dump("info",`writting update version on package [${name}] > ${pkgJSONPath} > ${JSON.stringify(pkg)}`)
                fs.writeFileSync(pkgJSONPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
            }

            return pkg
        }

    }
}

export default syncPackageVersionFromName