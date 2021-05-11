let { verbosity, objectToArrayMap } = require("@corenode/utils")
verbosity = verbosity.options({ method: "[CLI]" })

const _cli = global.corenode_cli
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

let cmdKeys = []

export default ({ commands, options }) => {
    let custom = _cli?.custom ?? []
    const argvf = process.args["_"].splice(2) ?? hideBin(process.argv)
    const cli = yargs(hideBin(process.argv))

    process.runtime[0].appendToController("appendCli", (entry) => {
        custom.push({ ...entry })
    })
    
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

        cli.option(option, { alias, type, description })
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

        cmdKeys.push(command)
        cli.command(command, description, args, exec)
    })

    if (argvf.length > 0) {
        if (Array.isArray(cmdKeys)) {
            let exists = false

            cmdKeys.forEach((key) => {
                if (key.includes(argvf[0])) {
                    return exists = true
                }
            })

            if (!exists) {
                cli.showHelp()
                verbosity.error("Unknown command, use a valid command! \n")
            }
        }
    } else {
        try {
            global.corenode.events.emit("cli_noCommand")
        } catch (error) {
            // so sorry
        }
    }

    cli
        .showHelpOnFail(true)
        .help()
        .argv
}