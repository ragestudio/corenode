import fs from 'fs'

/**
 * Get parsed version of package
 * @function getVersion
 * @param {object} opts
 * @param {object} opts.engine Return
 * @returns {string} projectRuntime
 */
export function getVersion(opts) {
    let version = "0.0.0"

    const projectEnv = global._env ?? {}
    const enginePkgPath = process.runtime.manifests.engine
    const projectPkgPath = process.runtime.manifests.project

    try {
        const pkgEngine = fs.existsSync(enginePkgPath) ? require(enginePkgPath) : {}
        const pkgProject = fs.existsSync(projectPkgPath) ? require(projectPkgPath) : {}

        if (opts?.engine) {
            version = pkgEngine["version"] ?? "0.0.0"
        } else {
            if (projectEnv.version) {
                version = projectEnv.version
            } else if (typeof pkgProject["version"] !== "undefined") {
                version = pkgProject["version"]
            }
        }
    } catch (error) {
        // terrible
    }

    return version
}

export default getVersion