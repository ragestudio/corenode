import { verbosity } from '@corenode/utils'

let vmObjects = {
    Error: class OverrideError extends Error {
        constructor(...context) {
            super(...context)
            verbosity.options({ method: `[Unhandled ThrowError]`, dump: true, dumpFile: true }).error(...context)
        }
    }
}

module.exports = vmObjects