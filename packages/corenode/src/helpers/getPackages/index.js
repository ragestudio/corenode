import path from 'path'
import isProjectMode from '../isProjectMode'
import { readRootDirectorySync } from '@corenode/utils'

/**
 * Get all packages from current project
 * @function getPackages 
 * @param {boolean} [params.fullPath = false] Return array with full path to packages
 * @returns {array} Packages names
 */
export function getPackages(params) {
    if (isProjectMode()) {
        return readRootDirectorySync("packages", params)
    }

    return path.resolve(process.cwd(), './src')
}

export default getPackages