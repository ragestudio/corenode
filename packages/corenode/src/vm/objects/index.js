import { verbosity } from '@corenode/utils'

let vmObjects = {
    Error: class OverrideError extends Error {
        constructor(...context) {
            super(...context)
            verbosity.options({ method: `[Unhandled ThrowError]`, dump: true, dumpFile: true }).error(...context)
        }
    },
    out: function (...args) {
        const v = verbosity.options({ method: `[${this.id ?? "out"}]` })
        v.log(...args)
    }
}

module.exports = vmObjects