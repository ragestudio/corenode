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
    fork: function (fn) {
        const machine = new EvalMachine()
        machine.run()
    }
}

module.exports = vmObjects