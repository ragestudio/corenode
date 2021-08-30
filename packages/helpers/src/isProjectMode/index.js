import path from 'path'
import fs from 'fs'

/**
 * Check if the current project is on project mode
 * @function isProjectMode 
 * @param {string} [dir = undefined] Check from custom directory instead default project path
 * @returns {boolean}
 */
export function isProjectMode(dir) {
    const from = dir ?? process.cwd()
    const packagesDir = path.resolve(from, './packages')

    if (fs.existsSync(packagesDir)) {
        if (fs.readdirSync(packagesDir)) {
            return true
        }
    }

    return false
}

export default isProjectMode