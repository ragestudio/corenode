import { verbosity } from '@corenode/utils'
import { EvalMachine } from '../index'

let vmObjects = {
    Error: class OverrideError extends Error {
        constructor(...context) {
            super(...context)
            process.runtime.logger.dump("error", ...context)
            verbosity.options({ method: `[Unhandled ThrowError]` }).error(...context)
        }
    },
    out: function (...args) {
        const v = verbosity.options({ method: `[${this.id ?? "out"}]` })
        v.log(...args)
    },
    fork: function (fn, options, callback) {
        const machine = new EvalMachine()
        machine.do(fn, options, (...context) => {
            if (typeof callback === "function") {
                callback(...context)
            }
            machine.destroy()
        })
    },
}

module.exports = vmObjects