#!/usr/bin/env node
const corenode = require('../../index.js')

corenode.runInNewRuntime(async (_runtime) => {
    await _runtime.initialize()

    const path = require('path')
    const fs = require('fs')
    const { program, Command, Option, Argument } = require('commander')

    const internalCommandsPath = path.resolve(__dirname, 'commands')
    const internalOptionsPath = path.resolve(__dirname, 'options')

    function loadInternalsComponents(entry) {
        let map = []

        if (fs.existsSync(entry)) {
            const stats = fs.lstatSync(internalCommandsPath)
            const isFile = stats.isFile()
            const isDir = stats.isDirectory()

            if (!isFile && !isDir) {
                // unsupported method
                return map
            }

            if (isFile) {
                fs.readdirSync(internalCommandsPath).forEach(namespace => {
                    const commandDir = path.resolve(internalCommandsPath, namespace)
                    commandMap.push(require(commandDir))
                })
            }

            if (isDir) {
                const _module = require(entry)

                if (Array.isArray(_module)) {
                    map = _module
                } else {
                    map.push(_module)
                }
            }

        }

        return map
    }

    let optionsFn = Object()
    let optionsMap = Array()
    let commandMap = Array()

    // read and load all commands scripts
    // first, read all files in internalCommandsPath
    const internalCommands = loadInternalsComponents(internalCommandsPath)
    commandMap = [...commandMap, ...(Array.isArray(internalCommands) ? internalCommands : [])]
    // TODO: Load custom commands from external directory

    // read and load all options
    // first, read all internal options
    const internalOptions = loadInternalsComponents(internalOptionsPath)
    optionsMap = [...optionsMap, ...(Array.isArray(internalOptions) ? internalOptions : [])]
    // TODO: Load custom options from external directory

    // load custom commands
    if (process.cli && Array.isArray(process.cli.custom)) {
        process.cli.custom.forEach(item => {
            commandMap.push(item)
        })
    }

    // load options map
    optionsMap.forEach(item => {
        if (typeof item.option === "undefined") {
            return false
        }
        const triggers = []

        // register exec function
        optionsFn[item.option] = item.exec

        if (typeof item.alias !== "undefined") {
            triggers.push(`-${item.alias}`)
        }
        triggers.push(`--${item.option}`)

        const opt = new Option(`${triggers.join(", ")}`)
        program.addOption(opt)
    })

    //* load command map
    commandMap.forEach(item => {
        if (typeof item.command === "undefined") {
            return false
        }

        const cmd = new Command(item.command).action(item.exec)

        if (Array.isArray(item.arguments)) {
            item.arguments.forEach(arg => {
                if (typeof arg === "string") {
                    cmd.addArgument(new Argument(arg))
                } else {
                    const _argument = new Argument(arg.argument, arg.description)

                    if (arg.defualt) {
                        _argument.default(arg.default)
                    }

                    cmd.addArgument(_argument)
                }
            })
        }

        if (Array.isArray(item.options)) {
            item.options.forEach(opt => {
                if (typeof opt === "string") {
                    cmd.option(opt)
                } else {
                    cmd.option(opt.option, opt.description, opt.default)
                }
            })
        }

        program.addCommand(cmd)
    })

    program.parse()

    const options = program.opts()
    Object.keys(options).forEach(key => {
        if (typeof optionsFn[key] === "function") {
            optionsFn[key]()
        }
    })
})