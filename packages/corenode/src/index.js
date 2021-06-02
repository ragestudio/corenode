/**
 * corenode
 * @module corenode 
 */
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'

const REPL = require('./repl')
const { EvalMachine } = require('./vm/index.js')
const { Logger } = require('./logger')

let { verbosity, schemizedParse } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })

const environmentFiles = ['.corenode', '.corenode.js', '.corenode.ts', '.corenode.json']
class Runtime {
    constructor(load) {
        this.load = load

        // handle load params
        if (this.load.cwd) {
            if (!path.isAbsolute(this.load.cwd)) {
                this.load.cwd = path.resolve(this.load.cwd)
            }

            process.chdir(this.load.cwd)
        }
        if (this.load.args) {
            process.args = this.load.args
        }

        // set undefined globals
        if (typeof global._inited === "undefined") {
            global._inited = false
        }
        if (typeof global.isLocalMode === "undefined") {
            global.isLocalMode = false
        }
        if (typeof process.runtime !== "object") {
            process.runtime = {}
        }

        // Create controllers
        this.controller = {}
        this.helpers = require("./helpers")
        this.addons = null

        this.events = new EventEmitter()
        this.logger = new Logger()

        this.setEvents()
        this.init()
    }

    get = {
        environmentFiles: () => environmentFiles,
        paths: {
            _env: () => global._loadedEnvPath ?? path.resolve(process.cwd(), '.corenode'),
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

    createProjectGlobal(instance = {}) {
        instance.version = this.helpers.getVersion({ engine: false })
        instance._versionScheme = { mayor: 0, minor: 1, patch: 2 }

        instance._envpath = this.get.paths._env()
        instance._runtimeSource = this.get.paths._src()
        instance._runtimeRoot = this.get.paths._root()

        return instance
    }

    createRuntimeGlobal(instance = {}) {
        instance.argvf = process.argv.slice(1)
        instance.version = this.helpers.getVersion({ engine: true })
        instance.isMain = require.main === module

        return instance
    }

    setEnvironment() {
        environmentFiles.forEach((file) => {
            const fromPath = path.resolve(process.cwd(), `./${file}`)

            if (fs.existsSync(fromPath)) {
                global._loadedEnvPath = fromPath

                try {
                    global._env = JSON.parse(fs.readFileSync(fromPath, 'utf-8'))
                } catch (error) {
                    console.error(`\n🆘  Error parsing runtime env > ${error.message} \n\n`)
                    console.error(error)
                }
            }
        })
    }

    setEvents() {
        this.events.addListener("cli_noCommand", () => {
            REPL.attachREPL()
        })
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                if (!global._inited) {
                    global._cli = {}
                    global._env = {}

                    this.setEnvironment()

                    global._packages = {
                        _engine: path.resolve(__dirname, '../package.json'),
                        _project: path.resolve(process.cwd(), 'package.json')
                    }

                    global.project = this.createProjectGlobal()
                    process.runtime = this.createRuntimeGlobal(this)

                    // detect local mode
                    try {
                        const rootPkg = this.helpers.getRootPackage()

                        if (rootPkg.name.includes("corenode")) {
                            global.isLocalMode = true
                        }
                    } catch (error) {
                        // terrible
                    }

                    // create new addonController
                    const addonController = require("./addons").default
                    this.addons = new addonController()

                    // flag runtime as inited
                    global._inited = true
                }

                // warn local mode
                if (process.env.LOCAL_BIN == "true" && !global.isLocalMode) {
                    console.warn("\n\x1b[7m", `⚠️  'LOCAL_BIN' environment flag is enabled, but this project is not allowed to run in local mode, ignoring running in local mode!`, "\x1b[0m\n")
                } else if (global.isLocalMode) {
                    console.warn("\n\n\x1b[7m", `🚧  USING LOCAL DEVELOPMENT MODE  🚧`, "\x1b[0m\n\n")
                }

                let { targetBin, isLocalMode } = this.load
                if (isLocalMode) {
                    global.isLocalMode = true
                }

                // load
                if (this.load.runCli) {
                    const args = require("yargs-parser")(process.argv)

                    process.parsedArgs = args
                    process.runtime.repl = REPL

                    // TODO: overrides cli commands over file loader
                    if (typeof args["_"][2] !== "undefined") {
                        const fileFromArgs = path.resolve(args["_"][2])

                        if (!targetBin && fs.existsSync(fileFromArgs)) {
                            if (fs.lstatSync(fileFromArgs).isFile()) {
                                targetBin = fileFromArgs
                            }
                        }

                        if (targetBin) {
                            try {
                                if (!fs.existsSync(targetBin)) {
                                    throw new Error(`Cannot read loader script [${targetBin}]`)
                                }
                                new EvalMachine({
                                    file: targetBin
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
                        REPL.attachREPL()
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