import getRootPackage from '../getRootPackage'

/**
 * Check if the current project is corenode
 * @function isCorenodeProject 
 * @returns {boolean}
 */
export function isCorenodeProject() {
    return getRootPackage().name === "corenode"
}

export default isCorenodeProject