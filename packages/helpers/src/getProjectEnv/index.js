/**
 * Get the entire runtime enviroment 
 * @function getProjectEnv 
 * @returns {object} projectRuntime
 */
export function getProjectEnv() {
    return global._env
}

export default getProjectEnv