import log4js from 'log4js'
import { getDevRuntimeEnv } from '@nodecorejs/dot-runtime'

const outputlogs = getDevRuntimeEnv().outputLogs ?? null

let cache = []

export const outputLog = {
    dump: (print) => {
        log4js.configure({
            appenders: {
                logs: { type: "file", filename: `${outputlogs ?? "nodecore_logs"}` },
            },
            categories: {
                default: { appenders: ["logs"], level: "debug" }
            }
        })
        const logger = log4js.getLogger("logs")

        cache.push(`${(new Date().getTime().toLocaleString())} > ${print}`)
        logger.debug(print)
    }
}


export default outputLog