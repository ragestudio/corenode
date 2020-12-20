import ora from 'ora'
import log4js from 'log4js'
import { getDevRuntimeEnv } from '@nodecorejs/dot-runtime'

const outputlogs = getDevRuntimeEnv().outputLogs ?? null

log4js.configure({
    appenders: {
        logs: { type: "file", filename: `${outputlogs ?? "nodecore_logs"}` },
    },
    categories: {
        default: { appenders: ["logs"], level: "debug" }
    }
});
const logger = log4js.getLogger("logs");

let cache = []

export const outputLog = {
    spinner: ora({
        spinner: "dots",
        text: "Initializing..."
    }),
    start: (print) => {
        outputLog.spinner.start(print)
    },
    stop: () => {
        outputLog.spinner.stop()
    },
    success: () => {
        outputLog.spinner.text = print
        outputLog.spinner.succeed()
    },
    text: (print) => {
        outputLog.setCache(print)
        outputLog.spinner.text = print
        outputLog.start()
    },
    setCache: (print) => {
        cache.push(`${(new Date().getTime().toLocaleString())} > ${print}`)
        logger.debug(print)
    },
    show: (print) => {
        //one frame
    },
    returnCache: () => {
        return cache
    }
}


export default outputLog