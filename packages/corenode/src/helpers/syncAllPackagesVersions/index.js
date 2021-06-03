import getPackages from '../getPackages'
import syncPackageVersionFromName from '../syncPackageVersionFromName'
import { verbosity } from '@corenode/utils'

/**
 * Syncs all packages from current project with the global project version
 * @function syncAllPackagesVersions 
 */
export function syncAllPackagesVersions() {
    const packages = getPackages()
    packages.forEach((pkg) => {
        try {
            syncPackageVersionFromName(pkg, true)
            verbosity.options({ time: false }).log(`[${pkg}] ✅ New version synchronized`)
        } catch (error) {
            verbosity.options({ time: false }).log(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}

export default syncAllPackagesVersions