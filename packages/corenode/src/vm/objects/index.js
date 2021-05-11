import { verbosity } from '@corenode/utils'

let vmObjects = {
    Error: class OverrideError extends Error {
        constructor(...context) {
            super(...context)
            verbosity.options({ method: `[Unhandled ThrowError]`, dump: true, dumpFile: true }).error(...context)
        }
    },
    Cum: function (text) {
        const whiteBGScape = `\x1b[47m`
        const whiteFGScape = `\x1b[37m`

        const blackFGScape = `\x1b[30m`
        const resetScape = `\x1b[0m`

        const { columns, rows } = process.stdout

        let emptyLine = String()
        let centerLine = String()

        for (let index = 0; index < columns; index++) {
            if (index == (rows / 2)) {
                centerLine = `${centerLine}${text}`
            } else {
                centerLine = `${centerLine}-`
            }
        }

        for (let index = 0; index < columns; index++) {
            emptyLine = `${emptyLine}-`
        }

        for (let index = 0; index < rows; index++) {
            if (index == 0) {
                console.log(`${whiteBGScape}${whiteFGScape}`)
            }

            if (index == (rows / 2)) {
                console.log(`${blackFGScape}${centerLine}${whiteFGScape}`)
            } else {
                console.log(`${emptyLine}`)
            }
        }

        console.log(resetScape)
    }
}

module.exports = vmObjects