import path from 'path'
import fs from 'fs'

/**
 * Check if the current project is on development mode
 * @function isDevMode 
 * @returns {boolean}
 */
export function isDevMode() {
    if (process.env.NODE_ENV === "development") {
        return true
    }
    return fs.existsSync(path.resolve(process.cwd(), './.dev')) ? true : false
}

export default isDevMode