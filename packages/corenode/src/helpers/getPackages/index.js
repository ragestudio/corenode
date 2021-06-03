import path from 'path'
import { readRootDirectorySync, isProjectMode } from '@corenode/utils'

/**
 * Get all packages from current project
 * @function getPackages 
 * @param {boolean} [params.fullPath = false] Return array with full path to packages
 * @returns {array} Packages names
 */
export function getPackages(params) {
    if (isProjectMode()) {
        return path.resolve(process.cwd(), './src')
    }

    return readRootDirectorySync("packages", params)
}

export default getPackages