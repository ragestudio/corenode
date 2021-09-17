#!/usr/bin/env node
const { runInNewRuntime } = require('../../index.js')

runInNewRuntime((runtime) => {
    const { program, Command, Option } = require('commander')

    let optionsFn = {}

    const optionsMap = require('./options.js')
    const commandMap = require('./commands.js')

    //* load custom commands
    if (process.cli && Array.isArray(process.cli.custom)) {
        process.cli.custom.forEach(item => {
            commandMap.push(item)
        })
    }

    //* load options map
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
                cmd.argument(arg)
            })
        }

        if (Array.isArray(item.options)) {
            item.options.forEach(opt => {
                cmd.option(opt)
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