import getProjectEnv from '../getProjectEnv'

/**
 * Get `originGit` from `.corenode` env 
 * @function getOriginGit 
 * @returns {string} originGit
 */
export function getOriginGit() {
    return getProjectEnv().development.originGit
}

export default getOriginGit