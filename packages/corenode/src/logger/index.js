import { createLogger, format, transports } from 'winston'
import StackTrace from 'stacktrace-js'
import { verbosity } from '@corenode/utils'

const { combine, timestamp, label, printf } = format

export class Logger {
    log = (...context) => {
        StackTrace.get().then((stack) => {
            stack = stack[2]
            this.output({ level: "log", stack }, ...context)
        })
    }
    warn = (...context) => {
        StackTrace.get().then((stack) => {
            stack = stack[2]
            this.output({ level: "warn", stack }, ...context)
        })
    }
    error = (...context) => {
        StackTrace.get().then((stack) => {
            stack = stack[2]
            this.output({ level: "error", stack }, ...context)
        })
    }

    dump = (level, ...context) => {
        StackTrace.get().then((stack) => {
            stack = stack[2]
            this.createLogger({ level: level, stack }).info(...context)
        })
    }

    async output(payload, ...context) {
        const { level, stack } = payload

        this.createLogger({ level, stack }).info(...context)
        verbosity.options({ method: `[${stack.functionName}]` })[level](...context)
    }

    createLogger({ level, stack }) {
        return createLogger({
            format: combine(
                label({ label: level }),
                timestamp(),
                printf(({ message, label, timestamp }) => {
                    return `> ${timestamp} ${(stack?.method ?? false) ? `${stack.method}` : ''}[${label ?? "log"}] : ${message}`
                })
            ),
            transports: [
                new transports.File({ filename: "dumps.log" }),
            ],
        })
    }
}
