
import path from 'path'
// @ts-ignore
import stackTrace from 'stack-trace'
import chalk from 'chalk'
import { objectToArrayMap } from './objectToArray'
import chalkRandomColor from './chalkRandomColor'

const verbosify = (trace, data, params) => {
    let decoratorData = {
        time: new Date().toLocaleTimeString(),
        line: null,
        file: null,
        method: null
    }
    let options = {
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

    if (typeof(params) !== "undefined") {
        options = { ...options, ...params }
    }

    try {
        if (typeof(trace) !== "undefined") {
            decoratorData.line = `(:${trace.getLineNumber()})`
            decoratorData.file = path.basename(trace.getFileName())
            decoratorData.method = `[${trace.getFunctionName()}]`
        }

        const paint = (type, data) => {
            let target = chalk

            const colors = options.colors

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

        const stackTraceKeys = Object.keys(decoratorOptions)
        const stackTraceLength = stackTraceKeys.length
        let modifyCount = 0
        let tmp

        for (let i = 0; i < stackTraceLength; i++) {
            const key = stackTraceKeys[i]
            const stackTraceDataKey = `${stackTraceData[key]}`
            const divisor = getColor((i == (stackTraceLength - 1) ? " | " : " > "), 0)

            if (typeof (stackTraceData[key]) !== "undefined" && decoratorOptions[key]) {
                if (Array.isArray(data)) {
                    if (modifyCount == 0) {
                        tmp = (getColor(stackTraceDataKey, 0) + divisor)
                    } else {
                        tmp = (getColor(stackTraceDataKey, 0) + divisor + tmp)
                    }
                    if (i == (stackTraceLength - 1)) {
                        let mix = []
                        data.forEach((element) => {
                            if (options.decoratorColor[1] || options.logColor[1]) {
                                if (typeof (element) == "string") {
                                    return mix.push(getColor(element, 1))
                                }
                            }
                            mix.push(element)
                        })
                        mix.unshift(tmp)
                        data = mix
                    }
                } else {
                    // @ts-ignore
                    data = (getColor(stackTraceDataKey, 0) + divisor + getColor(data, 1))
                }
                modifyCount++
            }
        }

        // if (Array.isArray(data)) {
        //     // @ts-ignore
        //     return console[opt.type](...data)
        // }

        // @ts-ignore
        return data
    } catch (error) {
        return error
    }
}

const random = (...context) => {
    return console.log(chalkRandomColor(verbosify(stackTrace.get()[1], ...context)))
}
function log(...context) {
    return console.log(verbosify(stackTrace.get()[1], ...context))
}

export default {
    log,
    random
}