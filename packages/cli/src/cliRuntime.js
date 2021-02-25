import { objectToArrayMap } from '@nodecorejs/utils'

const _Global = global.nodecore_cli
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

function cliRuntime({ commands, options }) {
    const custom = _Global?.custom ?? []

    const argumentParser = yargs(hideBin(process.argv))
    let optionsMap = options ?? []
    let commandMap = commands ?? []

    let optionsTrigger = {}

    if (Array.isArray(custom)) {
        custom.forEach((command) => {
            commandMap.push(command)
        })
    }

    optionsMap.forEach((opt) => {
        const option = opt.option
        const alias = opt.alias
        const type = opt.type ?? 'boolean'
        const description = opt.description
        const exec = opt.exec

        optionsTrigger[option] = exec

        if (Array.isArray(alias)) {
            alias.forEach((a) => {
                optionsTrigger[a] = exec
            })
        } else {
            optionsTrigger[alias] = exec
        }

        argumentParser.option(option, { alias, type, description })
    })

    commandMap.forEach((cmd) => {
        const command = cmd.command
        const description = cmd.description ?? ""
        const args = cmd.args ? ((yargs) => cmd.args(yargs)) : {}
        const exec = cmd.exec ? (argv) => {
            try {
                const argumentsMap = objectToArrayMap(argv)
                if (argumentsMap) {
                    argumentsMap.forEach((argument) => {
                        if (argument.value && typeof (optionsTrigger[argument.key]) == "function") {
                            optionsTrigger[argument.key](argument.value)
                        }
                    })
                }
                cmd.exec(argv)
            } catch (error) {
                console.log(`🆘 Error executing command! >`)
                console.error(`\n\t`, error)
            }
        } : (() => console.log(`This command not contains an executable script`))

        argumentParser.command(command, description, args, exec)
    })

    argumentParser
        .showHelpOnFail(true)
        .demandCommand(1)
        .strict()
        .help()
        .argv
}

export default cliRuntime