import { __installPackage, __installCore, __initCreateRuntime } from './scripts'
import outputLog from './utils/outputLog'

import commands from './commands.json'
import buildProyect from '@nodecorejs/builder'
import { getRuntimeEnv, getVersion, bootstrapProyect, releaseProyect } from '@nodecorejs/dot-runtime'

const runtimeEnv = getRuntimeEnv()
const parsedArgs = process.argv.slice(2);
const args = require("args-parser")(process.argv)

// Define defaults behaviors and options
let opts = {
    clearBefore: false,
}

const functionalMap = {
    clearBF: () => {
        opts.clearBefore = true
    },
    add: (argv) => {
        if (typeof (argv.pkg) !== "undefined") {
            if (argv.clear) {
                console.clear()
            }
            __requiredRuntime()
            __installCore({ pkg: argv.pkg })
        }
    },
    init: () => {
        __initCreateRuntime()
    },
    build: () => {
        console.log(`🔄 Starting builder...`)
        buildProyect()
    },
    release: () => {
        releaseProyect()
    },
    bsproyect: () => {
        bootstrapProyect()
    },
    version: () => {
        if (args[1]) {
            switch (args[1]) {
                case "update": {
                    console.log(`⚙ Updating version (${version}) to (${args[2]})`)
                    return updateVersion(args[2])
                }
                case "bump": {
                    return bumpVersion(args[2])
                }
                default: {
                    console.error("Invalid arguments!")
                    return false
                }
            }
        }else {
            console.log(getVersion())
        }
    },
}

if (args) {
    try {
        if (typeof(commands[args[0]]) !== "undefined") {
            const command = functionalMap[args[0]]
            if (typeof (command) == "function") {
                command(args)
            }else{
                console.log("🆘 Invalid command, is not an function! ")
            }
        }
    } catch (error) {
        console.log(`🆘 Error trying execute command! >`)
        console.log(`\n${error}`)
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

