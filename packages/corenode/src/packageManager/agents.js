const child_process = require('child_process')
const { dargs } = require('@corenode/utils')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const agents = {
    npm: (cmd, packages, options = {}, cb) => {
        let opt = {
            ...options
        }
        function callback(...context) {
            if (typeof cb === 'function') {
                return cb(...context)
            }
            return false
        }

        if (typeof packages === 'function') {
            throw new TypeError('expected packages as first argument')
        }

        const npmCmd = opt.command ?? npmCommand
        // packages to install
        var deps = [].concat(packages).filter(Boolean)
        if (deps.length === 0) {
            return process.nextTick(() => {
                callback(null)
            })
        }

        var spawnArgs = {
            cwd: opt.cwd,
            env: opt.env || process.env,
            stdio: opt.stdio
        }
        var cliArgs = dargs(opt, {
            excludes: Object.keys(spawnArgs)
        })
        var args = [cmd].concat(deps).concat(cliArgs)
        var proc = child_process.spawn(npmCmd, args, spawnArgs)
        var error = ''

        if (proc.stderr) {
            proc.stderr.on('data', function (data) {
                error += data.toString()
            })
        }

        proc.once('exit', function (code) {
            // ensure we pass an Error
            if (code === 0) {
                callback(null)
            } else {
                var msg = error || 'exit code ' + code
                callback(new Error(msg))
            }
        })

        return proc

    }
}

module.exports = agents