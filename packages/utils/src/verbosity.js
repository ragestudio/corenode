const StackTrace = require("stacktrace-js")
const chalk = require("chalk")
const { objectToArrayMap } = require("./objectToArray")
const chalkRandomColor = require("./chalkRandomColor")

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
    dumpFile: false,
})
const defaultDecoratorData = Object.freeze({
    time: new Date().toLocaleTimeString(),
})

class verbosity {
    constructor() {
        this._options = { ...defaultDecoratorOptions }
        this._colors = { ...defaultColors }

        return this
    }

    transform(data, options, colors, decoratorData) {
        try {
            decoratorData = { ...decoratorData, ...defaultDecoratorData }
            let generationInstance = []

            if (!data) {
                return null
            }

            if (colors) {
                this._colors = { ...this._colors, ...colors }
            }
            if (options) {
                this._options = { ...this._options, ...options }
            }

            objectToArrayMap(this._options).forEach((element) => {
                let fromData = decoratorData[element.key]
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

            const decoratorString = this.generateDecorator(generationInstance, this._colors)
            const logString = this.generateLogString(data.log, this._colors)

            return [decoratorString, ...logString]
        } catch (error) {
            // woupsi
            console.log(error)
        }
    }

    generateDecorator(input, colors) {
        let output = ''
        for (let index = 0; index < input.length; index++) {
            const element = input[index]
            const divisor = (index == (input.length - 1) ? " > " : " | ")

            output = `${output}${element}${divisor}`
        }
        return this.paint('decorator', output, colors)
    }

    generateLogString(input, colors) {
        let output = []
        const logMap = objectToArrayMap(input)
        for (let index = 0; index < logMap.length; index++) {
            const element = logMap[index]
            output.push(this.paint('log', element.value, colors))
        }
        return output
    }

    paint(type, data, colors) {
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

    async output(type, options, colors, ...context) {
        let stack = await StackTrace.get()
        stack = stack[2]

        let response = this.transform({ log: { ...context } }, options, colors, { method: `[${stack.functionName}()]`, line: `(:${stack.lineNumber})`, file: stack.fileName })
        console[type](...response)

        return this
    }

    log(...context) {
        this.output('log', this._options, this._colors, ...context)
        return this
    }
    error(...context) {
        this.output('error', {
            ...this._options,
            prefix: "❌  ERROR"
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
        return this
    }
    warn(...context) {
        this.output('warn', {
            ...this._options,
            prefix: "⚠️  WARN"
        }, {
            decorator: {
                text: "black",
                bg: "bgYellowBright"
            },
            log: {
                text: "inverse",
                bg: false
            }
        }, ...context)
        return this
    }
    random(...context) {
        this.output('log', this._options, null, chalkRandomColor(...context))
        return this
    }

    // set configs
    options(params) {
        if (typeof (params) !== "undefined") {
            this._options = { ...this._options, ...params }
        }
        return this
    }
    colors(params) {
        if (typeof (params) !== "undefined") {
            objectToArrayMap(params).forEach((param) => {
                if (this._colors[param.key]) {
                    this._colors[param.key] = { ...this.colors[param.key], ...param.value }
                }
            })
        }
        return this
    }
}

module.exports = new verbosity()