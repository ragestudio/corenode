import fs from 'fs'

/**
 * Get project package.json
 * @function getRootPackage 
 * @returns {object}
 */
export function getRootPackage() {
    const projectPkgPath = global.manifestsPaths?.project

    if (projectPkgPath && fs.existsSync(projectPkgPath)) {
        return require(projectPkgPath)
    }

    return false
}

export default getRootPackage