/**
 * corenode
 * @module corenode 
 */
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'

const { EvalMachine } = require('./vm/index.js')
const { Logger } = require('./logger')

let { verbosity, schemizedParse } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })

const environmentFiles = ['.corenode', '.corenode.js', '.corenode.ts', '.corenode.json']
class Runtime {
    constructor(load, options) {
        this.isMain = require.main === module
        this.runParams = { load, options }
        this.opts = this.runParams.options

        if (this.opts.cwd) {
            process.chdir(this.opts.cwd)
        }
        if (this.opts.args) {
            process.args = this.opts.args
        }
        if (this.opts.argv) {
            process.argv = this.opts.argv
        }

        if (typeof (global._inited) === "undefined") {
            global._inited = false
        }

        if (typeof (process.runtime) !== "object") {
            process.runtime = {}
        }

        // Create controllers
        this.controller = {}
        this.helpers = require("./helpers")
        this.thread = 0 // By default
        this.addons = null

        this.events = new EventEmitter()
        this.logger = new Logger()

        this.setEvents()
        this.init()
    }

    get = {
        environmentFiles: () => environmentFiles,
        paths: {
            _env: () => path.resolve(process.cwd(), '.corenode'),
            _src: () => path.resolve(__dirname, ".."),
            _root: () => path.resolve(__dirname, '../../..')
        }
    }

    appendToController(key, value, options) {
        let properties = {
            configurable: options?.configurable ?? false,
            enumerable: options?.enumerable ?? true,
            value: value
        }

        if (options?._proto_)
            properties.__proto__ = options.__proto__

        if (options?.writable)
            properties.writable = options.writable

        Object.defineProperty(this.controller, key, properties)
        return this.controller[key]
    }

    setGlobals() {
        global.corenode_cli = {}
        global.corenode = {}

        const keywords = ["_packages", "_env",]

        keywords.forEach((key) => {
            if (typeof (global[key]) === "undefined") {
                global[key] = {}
            }
        })

        global._versionScheme = { mayor: 0, minor: 1, patch: 2 }
        global.isLocalMode = false

        global._envpath = this.get.paths._env()
        global._runtimeSource = this.get.paths._src()
        global._runtimeRoot = this.get.paths._root()

        Object.defineProperty(global, '_setPackage', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: Object.freeze((key, path) => {
                global._packages[key] = path
            })
        })
        Object.defineProperty(global, '_delPackage', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: Object.freeze((key) => {
                delete global._packages[key]
            })
        })

        global._setPackage("_engine", path.resolve(__dirname, '../package.json'))
        global._setPackage("_project", path.resolve(process.cwd(), 'package.json'))

        global.corenode = process.runtime
    }

    setEnvironment() {
        environmentFiles.forEach(file => {
            const fromPath = path.resolve(process.cwd(), `./${file}`)
            if (fs.existsSync(fromPath)) {
                global._envpath = fromPath
                try {
                    global._env = JSON.parse(fs.readFileSync(fromPath, 'utf-8'))
                } catch (error) {
                    console.error(`\n🆘  Error parsing runtime env > ${error.message} \n\n`)
                    console.error(error)
                }
            }
        })
    }

    startREPL() {
        try {
            const repl = require('repl')
            const machine = new EvalMachine()

            machine.onDestroy((address) => {
                console.error(`🛑 VM[${address}] Has been destroyed`)
                process.exit()
            })

            function fnEv(cmd, context, filename, callback) {
                try {
                    const out = machine.run(cmd)
                    callback(null, out)
                } catch (error) {
                    return callback(error.message)
                }
            }

            console.log(`|  REPL Console | v${this.version}_${process.versions.node} |\n`)
            repl.start({
                prompt: `#> `,
                useColors: true,
                eval: fnEv
            })
        } catch (error) {
            console.error(error)
            verbosity.error(`Error starting eval machine > ${error}`)
        }
    }

    setEvents() {
        this.events.addListener("cli_noCommand", () => {
            this.startREPL()
        })
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                process.runtime = this
                process.argvf = process.argv.slice(1)

                if (!global._inited) {
                    this.setGlobals()
                    this.setEnvironment()
                }

                // set version controller
                this.version = this.helpers.getVersion({ engine: true })
                this._version = schemizedParse(this.version, Object.keys(global._versionScheme), '.')

                // set aliasers

                // create new addonController
                const addonController = require("./addons").default
                this.addons = new addonController()

                // detect local mode
                try {
                    const rootPkg = this.helpers.getRootPackage()

                    if (rootPkg.name.includes("corenode")) {
                        global.isLocalMode = true
                    }
                } catch (error) {
                    // terrible
                }

                // flag runtime as inited
                global._inited = true

                // warn local mode
                if (process.env.LOCAL_BIN == "true" && !global.isLocalMode) {
                    console.warn("\n\x1b[7m", `⚠️  'LOCAL_BIN' environment flag is enabled, but this project is not allowed to run in local mode, ignoring running in local mode!`, "\x1b[0m\n")
                } else if (global.isLocalMode) {
                    console.warn("\n\n\x1b[7m", `🚧  USING LOCAL DEVELOPMENT MODE  🚧`, "\x1b[0m\n\n")
                }

                let { targetBin, isLocalMode } = this.runParams.load
                if (isLocalMode) {
                    global.isLocalMode = true
                }

                if (this.runParams.load.runCli) {
                    const yparser = require("yargs-parser")
                    const argv = process.argv
                    const args = yparser(argv)

                    // TODO: overrides cli commands over file loader
                    if (typeof args["_"][2] !== "undefined") {
                        const fileFromArgs = path.resolve(args["_"][2])
                        if (!targetBin && fs.existsSync(fileFromArgs)) {
                            targetBin = fileFromArgs
                        }
                        if (targetBin) {
                            try {
                                if (!fs.existsSync(targetBin)) {
                                    throw new Error(`Cannot read loader script [${targetBin}]`)
                                }
                                new EvalMachine({
                                    eval: targetBin
                                })
                            } catch (error) {
                                this.logger.dump("error", error.toString())
                                verbosity.options({ method: "[RUNTIME]" }).error(`Main loader > ${error.message}`)
                                console.log("This error has been exported, check the log file for more details")
                            }
                        } else {
                            return require('../internals/cli/dist')
                        }
                    } else {
                        this.startREPL()
                    }
                }

                return resolve()
            } catch (error) {
                return reject(error)
            }
        })
    }
}

module.exports = {
    Runtime,
    ...require("./helpers"),
}