
import path from 'path'
// @ts-ignore
import stackTrace from 'stack-trace'
import chalk from 'chalk'
import { objectToArrayMap } from './objectToArray'
import chalkRandomColor from './chalkRandomColor'

let opts = {
    line: false,
    method: true,
    file: false,
    time: true,
}

let colorsOpts = {
    decorator: {
        textColor: "blue",
        backgroundColor: false
    },
    log: {
        textColor: false,
        backgroundColor: false
    }
}

const verbosify = (data) => {
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
        if (typeof (trace) !== "undefined" && trace != null) {
            objectToArrayMap(decoratorData).forEach((element) => {
                if (opts[element.key] && trace[element.key]) {
                    decoratorData[element.key] = trace[element.key]
                }
            })
        }

        const paint = (type, data) => {
            if (typeof(data) !== "string") {
                return data
            }
            let target = chalk

            const colors = colorsOpts

            let textColor = colors[type].textColor
            let backgroundColor = colors[type].backgroundColor

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

        const decoratorMap = objectToArrayMap(decoratorData)
        for (let index = 0; index < decoratorMap.length; index++) {
            const element = decoratorMap[index];

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
        })
        console.log(...response)
        return this
    },
    random: function (...context) {
        console.log(chalkRandomColor(verbosify(null, ...context)))
        return this
    },
    options: function (params) {
        // TODO: Options validation
        if (typeof (params) !== "undefined" && params != null) {
            opts = { ...opts, ...params }
        }
        return this
    },
    colors: function (params) {
        if (typeof(params) !== "undefined" && params != null) {
            try {
                objectToArrayMap(params).forEach((param) => {
                    if (colorsOpts[param.key]) {
                        colorsOpts[param.key] = { ...colorsOpts[param.key], ...param.value }
                    }
                })
            } catch (error) {
                console.log(error)
            }
        }
        return this
    }
}