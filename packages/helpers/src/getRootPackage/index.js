import fs from 'fs'

/**
 * Get project package.json
 * @function getRootPackage 
 * @returns {object}
 */
export function getRootPackage() {
    const projectPkgPath = process.runtime.manifests?.project

    if (projectPkgPath && fs.existsSync(projectPkgPath)) {
        return require(projectPkgPath)
    }

    return false
}

export default getRootPackage