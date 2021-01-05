import path from 'path'
import stackTrace from 'stack-trace'
import chalk from 'chalk'
import { objectToArrayMap } from './objectToArray'
import chalkRandomColor from './chalkRandomColor'
import log4js from 'log4js'

const verbosify = (data, opts, colorsOpts) => {
    let { log, trace } = data

    let decoratorStr = ''
    let logStr = []

    let decoratorData = {
        time: new Date().toLocaleTimeString(),
        line: null,
        file: null,
        method: null
    }

    try {
        if (opts) {
            if (typeof (trace) !== "undefined" && trace != null) {
                objectToArrayMap(decoratorData).forEach((element) => {
                    if (typeof (opts[element.key]) == "string") {
                        decoratorData[element.key] = opts[element.key]
                    }
                    if (opts[element.key] === true && trace[element.key]) {
                        decoratorData[element.key] = trace[element.key]
                    }
                })
            }
        }

        const paint = (type, data) => {
            if (!colorsOpts) {
                return data
            }
            if (typeof (data) !== "string") {
                return data
            }
            let target = chalk

            const colors = colorsOpts

            let textColor = colors[type].text
            let backgroundColor = colors[type].bg

            if (textColor) {
                if (target[textColor]) {
                    target = target[textColor]
                }
            }

            if (backgroundColor) {
                if (target[backgroundColor]) {
                    target = target[backgroundColor]
                }
            }

            return target(data)
        }

        const decoratorMap = objectToArrayMap(decoratorData).filter(element => element.value != null)
        for (let index = 0; index < decoratorMap.length; index++) {
            const element = decoratorMap[index]
            const divisor = (index == (decoratorMap.length - 1) ? " > " : " | ")
            if (element.value != null && typeof (element.value) !== "undefined") {
                decoratorStr = `${decoratorStr}${element.value}${divisor}`
            }
        }
        decoratorStr = paint('decorator', decoratorStr)

        const logMap = objectToArrayMap(log)
        for (let index = 0; index < logMap.length; index++) {
            const element = logMap[index];
            logStr.push(paint('log', element.value))
        }

        return [decoratorStr, ...logStr]
    } catch (error) {
        return error
    }
}

const trace = stackTrace.get()[1]
const line = `(:${trace.getLineNumber()})`
const file = path.basename(trace.getFileName())
const method = `[${trace.getFunctionName()}]`

export default {
    opts: {
        line: false,
        method: true,
        file: false,
        time: true,
    },
    colorsOpts: {
        decorator: {
            text: "blue",
            bg: false
        },
        log: {
            text: false,
            bg: false
        }
    },
    log: function (...context) {
        let response = verbosify({
            trace: {
                file,
                line,
                method,
            },
            log: {
                ...context
            }
        }, this.opts, this.colorsOpts)
        console.log(...response)
        return this
    },
    dump: function (...context) {
        log4js.configure({
            appenders: {
                logs: { type: "file", filename: `logs_dump.log` },
            },
            categories: {
                default: { appenders: ["logs"], level: "debug" }
            }
        })
        const logger = log4js.getLogger("logs")

        logger.debug(...context)
        return this
    },
    error: function (...context) {
        this.colorsOpts.log.text = "red"
        this.log(...context)
        return this
    },
    random: function (...context) {
        let response = verbosify({
            trace: {
                file,
                line,
                method,
            },
            log: {
                ...context
            }
        }, this.opts)
        console.log(chalkRandomColor(response))
        return this
    },
    options: function (params) {
        // TODO: Options validation
        if (typeof (params) !== "undefined" && params != null) {
            this.opts = { ...this.opts, ...params }
        }
        return this
    },
    colors: function (params) {
        if (typeof (params) !== "undefined" && params != null) {
            try {
                objectToArrayMap(params).forEach((param) => {
                    if (this.colorsOpts[param.key]) {
                        this.colorsOpts[param.key] = { ...this.colorsOpts[param.key], ...param.value }
                    }
                })
            } catch (error) {
                // terrible
            }
        }
        return this
    }
}