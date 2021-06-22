import { verbosity } from '@corenode/utils'

class OverrideError extends Error {
    constructor(...context) {
        super(...context)
        process.runtime.logger.dump("error", ...context)
        verbosity.options({ method: `[Unhandled ThrowError]` }).error(...context)
    }
}

module.exports = OverrideError