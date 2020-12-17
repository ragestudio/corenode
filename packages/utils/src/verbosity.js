
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
    colors: {
        decorator: {
            textColor: "blue",
            backgroundColor: false
        },
        log: {
            textColor: false,
            backgroundColor: false
        },
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
            let target = chalk

            const colors = opts.colors

            let textColor = colors[type].textColor
            let backgroundColor = colors[type].backgroundColor

            if (textColor) {
                target = target[textColor]
            }

            if (backgroundColor) {
                target = target[backgroundColor]
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
            logStr.push(element)
        }
        

        console.log(decoratorStr, logStr)

        // for (let i = 0; i < stackTraceLength; i++) {
        //     const key = stackTraceKeys[i]
        //     const stackTraceDataKey = `${stackTraceData[key]}`

        //     if (typeof (stackTraceData[key]) !== "undefined" && decoratorOptions[key]) {
        //         if (Array.isArray(data)) {
        //             if (modifyCount == 0) {
        //                 tmp = (getColor(stackTraceDataKey, 0) + divisor)
        //             } else {
        //                 tmp = (getColor(stackTraceDataKey, 0) + divisor + tmp)
        //             }
        //             if (i == (stackTraceLength - 1)) {
        //                 let mix = []
        //                 data.forEach((element) => {
        //                     if (options.decoratorColor[1] || options.logColor[1]) {
        //                         if (typeof (element) == "string") {
        //                             return mix.push(getColor(element, 1))
        //                         }
        //                     }
        //                     mix.push(element)
        //                 })
        //                 mix.unshift(tmp)
        //                 data = mix
        //             }
        //         } else {
        //             // @ts-ignore
        //             data = (getColor(stackTraceDataKey, 0) + divisor + getColor(data, 1))
        //         }
        //         modifyCount++
        //     }
        // }

        // if (Array.isArray(data)) {
        //     // @ts-ignore
        //     return console[opt.type](...data)
        // }

        // @ts-ignore
        return [decoratorStr, logStr]
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
        console.log(verbosify({
            trace: {
                file,
                line,
                method,
            },
            log: {
                ...context
            }
        }))
        return this
    },
    random: function (...context) {
        console.log(chalkRandomColor(verbosify(null, ...context)))
        return this
    },
    options: function (argument) {
        // TODO: Option validation
        if (typeof (argument) !== "undefined" && argument != null) {
            opts = { ...opts, ...argument }
        }
        return this
    }
}