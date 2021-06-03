import path from 'path'
import fs from 'fs'

/**
 * Check if the current project is on development mode
 * @function isDevMode 
 * @returns {boolean}
 */
export function isDevMode() {
    return fs.existsSync(path.resolve(process.cwd(), './.dev'))
}

export default isDevMode