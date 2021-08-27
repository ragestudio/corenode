const yargs = require('yargs/yargs')
let { verbosity, objectToArrayMap } = require("@corenode/utils")
verbosity = verbosity.options({ method: "[CLI]" })

export default ({ commands, options }) => {
    const cliGlobal = process.cli ?? {} 

    // set helpers
    if (typeof cliGlobal.keys === "undefined") {
        cliGlobal.keys = []
    }
    
    process.runtime.appendToController("appendCli", (entry) => {
        custom.push({ ...entry })
    })

    // 
    const argv = process.argv
    const cli = yargs(process.argv)

    let optionsMap = options ?? []
    let commandMap = commands ?? []
    let optionsTrigger = {}

    if (Array.isArray(cliGlobal.custom)) {
        cliGlobal.custom.forEach((command) => {
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
        const exec = (argv) => {
            try {
                const argumentsMap = objectToArrayMap(argv)
                if (argumentsMap) {
                    argumentsMap.forEach((argument) => {
                        if (argument.value && typeof optionsTrigger[argument.key] === "function") {
                            optionsTrigger[argument.key](argument.value)
                        }
                    })
                }
                if (typeof cmd.exec === "function") {
                    cmd.exec(argv)
                }
            } catch (error) {
                console.log(`🆘 Error executing command! >`)
                console.error(`\n\t`, error)
            }
        }

        cliGlobal.keys.push(command)
        cli.command(command, description, args, exec)
    })

    if (Array.isArray(cliGlobal.keys)) {
        let exists = false

        cliGlobal.keys.forEach((key) => {
            if (key.includes(argv[0])) {
                return exists = true
            }
        })

        if (!exists) {
            process.runtime.events.emit('cli_noCommand')
        }
    }

    cli
        .showHelpOnFail(true)
        .help()
        .argv
}