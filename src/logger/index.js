import { createLogger, format, transports } from 'winston'
import StackTrace from 'stacktrace-js'

const { combine, timestamp, label, printf } = format
class Logger {
    constructor(params = {}){
        this.id = params.id ?? null
    }

    dump = (level, data) => {
        StackTrace.get().then((stack) => {
            stack = stack[2]
            this.createDump({ level: level, stack }).info(data)
        })
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
                new transports.File({ filename: global.dumpLogsFile ?? "dumps.log" }),
            ],
        })
    }
}

module.exports = Logger