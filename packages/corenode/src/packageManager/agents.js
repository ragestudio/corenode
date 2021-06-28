const child_process = require('child_process')
const { dargs } = require('@corenode/utils')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const agents = {
    npm: async (cmd, packages, options = {}, cb) => {
        function callback(...context) {
            if (typeof cb === 'function') {
                return cb(...context)
            }
            return false
        }

        // packages to install
        const deps = [].concat(packages).filter(Boolean)
        if (deps.length === 0) {
            return process.nextTick(() => {
                callback(null)
            })
        }

        const spawnArgs = {
            cwd: options.cwd,
            ...options.spawnArgs
        }

        let cliArgs = dargs(options, {
            excludes: Object.keys(spawnArgs)
        })
        let args = [cmd].concat(deps).concat(cliArgs)
        let error = null

        try {
            const thread = await child_process.spawn(npmCommand, args, spawnArgs)

            thread.once('exit', (code) => {
                callback(code, error)
                return code
            })
        } catch (error) {
            callback(1, error)
            return error
        }
    }
}

module.exports = agents