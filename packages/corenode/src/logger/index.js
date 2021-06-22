import { createLogger, format, transports } from 'winston'
import StackTrace from 'stacktrace-js'
import { verbosity } from '@corenode/utils'

const { combine, timestamp, label, printf } = format

class Logger {
    constructor(params = {}){
        this.id = params.id ?? null
    }

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

    dump = (level, data) => {
        StackTrace.get().then((stack) => {
            stack = stack[2]
            this.createDump({ level: level, stack }).info(data)
        })
    }

    output(payload, ...context) {
        const { level, stack } = payload

        this.createDump({ level, stack }).info(...context)
        verbosity.options({ method: `[${this.id? `${this.id} | ` : ""}${stack.functionName}]` })[level](...context)
    }

    createDump({ level, stack }) {
        return createLogger({
            format: combine(
                label({ label: level }),
                timestamp(),
                printf(({ message, label, timestamp }) => {
                    switch (label) {
                        case "error": {
                            return `> ${timestamp} (${stack?.functionName ?? "anonymous"})[error] : ${message} \n\t ${stack.toString()}`
                        }

                        default:
                            return `> ${timestamp} (${stack?.functionName ?? "anonymous"})[${label ?? "log"}] : ${message}`
                    }
                })
            ),
            transports: [
                new transports.File({ filename: "dumps.log" }),
            ],
        })
    }
}

module.exports = Logger