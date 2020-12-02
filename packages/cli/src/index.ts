import { __installPackage, __installCore, __initCreateRuntime } from './scripts'
import outputLog from './utils/outputLog'

import commands from './commands.json'
import { getRuntimeEnv } from '@nodecorejs/dot-runtime'

const runtimeEnv = getRuntimeEnv()
const args = process.argv.slice(2);

// Define defaults behaviors and options
let opts = {
    clearBefore: false,
}

const functionalMap = {
    clearBF: () => {
        opts.clearBefore = true
    },
    installCore: (argv) => {
        if (typeof (argv.pkg) !== "undefined") {
            if (argv.clear) {
                console.clear()
            }
            __requiredRuntime()
            __installCore({ pkg: argv.pkg })
        }
    },
    initRuntime: () => {
        __initCreateRuntime()
    }
}


if (args) {
    try {
        let argv = {}

        args.forEach(arg => {
            argv[arg]
            if (typeof (commands[arg]) !== "undefined") {
                if (typeof (functionalMap[commands[arg]]) == "function") {
                    return commands[arg](args)
                }
            }
        })
    } catch (error) {
        console.log("Error parsing arguments")
    }
}else {
    console.log("SHOW HELP")
}

function __requiredRuntime() {
    if (!runtimeEnv) {
        outputLog.spinner.fail(`runtimeEnv is not present`)
        return process.exit(1)
    }
    if (!runtimeEnv.src) {
        outputLog.spinner.fail(`(src) is not defined on runtimeEnv file`)
        return process.exit(1)
    }
    if (runtimeEnv.remoteSource) {
        return outputLog.spinner.warn(`remoteSource is not provided! Using fallback`)
    }
}

