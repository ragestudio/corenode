import path from 'path'
import stackTrace from 'stack-trace'
import chalk from 'chalk'
import { objectToArrayMap } from './objectToArray'
import chalkRandomColor from './chalkRandomColor'
import log4js from 'log4js'

const stack = stackTrace.get()[1]

const getStack = {
    line: `(:${stack.getLineNumber()})`,
    file: path.basename(stack.getFileName()),
    method: `[${stack.getFunctionName()}]`
}

const defaultColors = Object.freeze({
    decorator: {
        text: "blue",
        bg: false
    },
    log: {
        text: false,
        bg: false
    }
})
const defaultDecoratorOptions = Object.freeze({
    prefix: false,
    time: true,
    line: false,
    file: false,
    method: true,
})
const defaultDecoratorData = Object.freeze({
    prefix: null,
    time: new Date().toLocaleTimeString(),
    line: getStack.line,
    file: getStack.file,
    method: getStack.method
})

class verbosify {
    constructor(data, options, colors) {
        this.options = { ...defaultDecoratorOptions }

        this.colors = { ...defaultColors }
        this.decoratorData = { ...defaultDecoratorData }

        try {
            let generationInstance = []

            if (!data) {
                return null
            }

            if (colors) {
                this.colors = { ...this.colors, ...colors }
            }
            if (options) {
                this.options = { ...this.options, ...options }
            }

            objectToArrayMap(this.options).forEach((element) => {
                let fromData = this.decoratorData[element.key]

                const isElementString = typeof (element.value) === "string"
                const isElementNumber = typeof (element.value) === "number"

                if (isElementString || isElementNumber) {
                    fromData = String(element.value)
                }

                const isValidOption = element.value != null && element.value || isElementNumber
                const isValidData = typeof (fromData) !== "undefined" && fromData || typeof (fromData) === "number"

                if (isValidOption && isValidData) {
                    generationInstance.push(fromData)
                }
            })

            const decoratorString = this.generateDecorator(generationInstance, this.colors)
            const logString = this.generateLogString(data.log, this.colors)

            return [decoratorString, ...logString]
        } catch (error) {
            // woupsi
            console.log(error)
        }
    }

    generateDecorator = (input, colors) => {
        let output = ''
        for (let index = 0; index < input.length; index++) {
            const element = input[index]
            const divisor = (index == (input.length - 1) ? " > " : " | ")

            output = `${output}${element}${divisor}`
        }
        return this.paint('decorator', output, colors)
    }

    generateLogString = (input, colors) => {
        let output = []
        const logMap = objectToArrayMap(input)
        for (let index = 0; index < logMap.length; index++) {
            const element = logMap[index]
            output.push(this.paint('log', element.value, colors))
        }
        return output
    }

    paint = (type, data, colors) => {
        if (!colors) {
            return data
        }
        if (typeof (data) !== "string") {
            return data
        }
        let target = chalk

        const colorsOpt = colors

        let textColor = colorsOpt[type].text
        let backgroundColor = colorsOpt[type].bg

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
}

export default {
    _options: {},
    _colors: {},
    output: function (t, o, c, ...context) {
        let response = new verbosify({ log: { ...context } }, o, c)
        console[t](...response)
        // force to flush
        this._options = {}
        this._colors = {}

        return this
    },
    log: function (...context) {
        try {
            this.output('log', this._options, this._colors, ...context)
        } catch (error) {
            // woupssi
        }
        return this
    },
    error: function (...context) {
        try {
            this.output('error', {
                ...this._options,
                prefix: "❌ ERROR"
            }, {
                decorator: {
                    text: "black",
                    bg: "bgYellow"
                },
                log: {
                    text: "red",
                    bg: false
                }
            }, ...context)
        } catch (error) {
            // woupssi
        }
        return this
    },
    random: function (...context) {
        try {
            this.output('log', this._options, null, chalkRandomColor(...context))
        } catch (error) {
            // woupssi
        }
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
    options: function (params) {
        // TODO: Options validation
        try {
            if (typeof (params) !== "undefined" && params != null) {
                this._options = { ...this._options, ...params }
            }
        } catch (error) {
            // terrible
        }
        return this
    },
    colors: function (params) {
        if (typeof (params) !== "undefined" && params != null) {
            try {
                objectToArrayMap(params).forEach((param) => {
                    if (this._colors[param.key]) {
                        this._colors[param.key] = { ...this._colors[param.key], ...param.value }
                    }
                })
            } catch (error) {
                // terrible
            }
        }
        return this
    }
}