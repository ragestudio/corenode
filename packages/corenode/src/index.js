/**
 * corenode
 * @module corenode 
 */

const path = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')
const { verbosity, objectToArrayMap } = require("@corenode/utils")

//* PRIMORDIAL LIBRARIES
const packageManager = require('./packageManager')
const net = require('./net')
const repl = require('./repl')
const moduleLib = require('./module')
const logger = require('./logger')
const constables = require('./constables')

//* constants
const environmentFiles = global.environmentFiles ?? ['.corenode', '.corenode.js', '.corenode.ts', '.corenode.json']
class Runtime {
    constructor(load) {
        this.load = load

        //? handle load params
        if (this.load.cwd) {
            if (!path.isAbsolute(this.load.cwd)) {
                this.load.cwd = path.resolve(this.load.cwd)
            }

            process.chdir(this.load.cwd)
        }
        if (this.load.args) {
            process.args = this.load.args
        }

        this.args = require("yargs-parser")(process.argv)
        process.parsedArgs = this.args
        this.disableCheckDependencies = this.args.disableCheckDependencies ?? false

        //? set undefined globals
        if (typeof global.isLocalMode === "undefined") {
            global.isLocalMode = false
        }
        if (typeof process.runtime !== "object") {
            process.runtime = {}
        }

        global._versionScheme = { mayor: 0, minor: 1, patch: 2 }
        global._packages = {
            _engine: path.resolve(__dirname, '../package.json'),
            _project: path.resolve(process.cwd(), 'package.json')
        }

        // register primordials modules
        this.registerModulesAliases({
            "factory": path.resolve(__dirname, 'factory'),
            "filesystem": path.resolve(__dirname, 'filesystem'),
            "@@helpers": path.resolve(__dirname, 'helpers'),
            "@@addons": path.resolve(__dirname, 'addons'),
            "@@classes": path.resolve(__dirname, 'classes'),
            "@@vm": path.resolve(__dirname, 'vm'),
            "@@libs": path.resolve(__dirname, 'libs'),
            "@@constables": path.resolve(__dirname, 'constables')
        })

        // controllers
        this.modulesAliases = {}
        this.modulesPaths = {}

        this.objects = {}
        this.controller = {}
        this.helpers = require("./helpers")
        this.addonsController = null

        this.events = new EventEmitter()
        this.logger = new logger()

        // runtime preload
        this.preloadDone = false
        this.preloadEvents = ['init_addons_done']
        this.preloadPromises = []

        // set runtime objects
        const internalObjects = this.getInternalObjects()
        if (typeof internalObjects === 'object') {
            objectToArrayMap(internalObjects).forEach((obj) => {
                this.createRuntimeObject(obj.key, obj.value)
            })
        }

        const builtInEvents = require('./events')
        if (Array.isArray(builtInEvents)) {
            builtInEvents.forEach((_case) => {
                this.events.addListener(_case.on, _case.event)
            })
        }

        this.initialize()
    }

    get = {
        environmentFiles: () => environmentFiles,
        paths: {
            _env: () => global._loadedEnvPath ?? path.resolve(process.cwd(), '.corenode'),
            _src: () => path.resolve(__dirname, ".."),
            _root: () => path.resolve(__dirname, '../../..')
        }
    }

    getInternalObjects = () => {
        let objects = {}

        try {
            const internalObjects = require('../internals/objects')
            objects = internalObjects
        } catch (error) {
            this.logger.dump(error)
            this.logger.error(`Failed to get internal objects`)
        }

        return objects
    }

    createRuntimeObject = (key, thing) => {
        if (typeof this.objects[key] === "undefined") {
            this.objects[key] = thing
        } else {
            throw new Error(`[${key}] is already set`)
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

        instance._envpath = this.get.paths._env()
        instance._runtimeSource = this.get.paths._src()
        instance._runtimeRoot = this.get.paths._root()

        return instance
    }

    createRuntimeGlobal(instance = {}) {
        instance.argvf = process.argv.slice(1)
        instance.version = this.helpers.getVersion({ engine: true })

        return instance
    }

    initEnvironment() {
        //* load dotenv
        require('dotenv').config()

        environmentFiles.forEach((file) => {
            const fromPath = path.resolve(process.cwd(), `./${file}`)

            if (fs.existsSync(fromPath)) {
                global._loadedEnvPath = fromPath

                try {
                    const runtimeEnv = JSON.parse(fs.readFileSync(fromPath, 'utf-8'))
                    process.env = { ...runtimeEnv }
                } catch (error) {
                    console.error(`\n🆘  Error parsing runtime env > ${error.message} \n\n`)
                    console.error(error)
                }
            }
        })

        global._env = process.env
    }

    registerModulesAliases = (mutation) => {
        if (typeof mutation === "object") {
            this.modulesAliases = {
                ...this.modulesAliases,
                ...mutation
            }
        }

        this.overrideModuleController()
    }

    registerModulesPaths = (mutation) => {
        if (typeof mutation === "object") {
            this.modulesPaths = {
                ...this.modulesPaths,
                ...mutation
            }
        }

        this.overrideModuleController()
    }

    appendToCli = (entries) => {
        let commands = []

        if (Array.isArray(entries)) {
            commands = entries
        } else if (typeof entries === "object") {
            commands.push(entries)
        }

        commands.forEach((entry) => {
            if (typeof global._cli.custom === "undefined") {
                global._cli.custom = []
            }
            global._cli.custom.push({ ...entry, exec: (...args) => entry.exec(this, ...args) })
        })
    }

    overrideModuleController = () => {
        module = moduleLib.override(module, { aliases: this.modulesAliases, paths: this.modulesPaths })
    }

    initPreloaders() {
        const eventPromise = (id) => {
            return new Promise((res, rej) => {
                this.events.on(id, () => {
                    return res()
                })
            })
        }

        this.preloadEvents.forEach((wait) => {
            this.preloadPromises.push(eventPromise(wait))
        })
    }

    waitForPreloadEvent = (event) => {
        this.preloadPromises.push(event)
    }

    async initialize() {
        return new Promise(async (resolve, reject) => {
            try {
                global._cli = {}
                global._env = {}

                this.initEnvironment()

                //? set global aliases
                this.modulesAliases = {
                    ...global._env.modulesAliases
                }
                this.modulesPaths = {
                    ...global._env.modulesPaths
                }

                global.project = this.createProjectGlobal()
                global.runtime = process.runtime = this.createRuntimeGlobal(this)

                //? detect local mode
                try {
                    const rootPkg = this.helpers.getRootPackage()

                    if (rootPkg.name.includes("corenode")) {
                        global.isLocalMode = true
                    }
                } catch (error) {
                    // terrible
                }

                if (this.load.isLocalMode) {
                    global.isLocalMode = true
                }

                // warn local mode
                if (process.env.LOCAL_BIN == "true" && !global.isLocalMode) {
                    console.warn("\n\x1b[7m", constables.INVALID_LOCALMODE_FLAG, "\x1b[0m\n")
                } else if (global.isLocalMode) {
                    console.warn("\n\n\x1b[7m", constables.USING_LOCALMODE, "\x1b[0m\n\n")
                }

                //* create and initialize runtime controllers
                const { EvalMachine, VMController } = require('./vm')
                this.vmController = new VMController()

                const { addonsController } = require("./addons")
                this.addonsController = new addonsController()

                //* set preloaders before load
                this.initPreloaders()

                //? fire preloaders
                await this.addonsController.checkDependencies()
                this.addonsController.init()

                //? await for them
                await Promise.all(this.preloadPromises)
                this.preloadDone = true

                //* LOAD
                let { targetBin } = this.load

                if (typeof this.args["_"][2] !== "undefined") {
                    const fileFromArgs = path.resolve(this.args["_"][2])

                    if (!targetBin && fs.existsSync(fileFromArgs)) {
                        if (fs.lstatSync(fileFromArgs).isFile()) {
                            targetBin = fileFromArgs
                        }
                    }
                } 

                if (typeof targetBin !== "undefined") {
                    try {
                        if (!fs.existsSync(targetBin)) {
                            throw new Error(`Cannot read loader script [${targetBin}]`)
                        }

                        new EvalMachine({
                            file: targetBin,
                            onError: (err) => {
                                this.logger.dump("error", err.toString())
                                verbosity.options({ method: "[script]", file: targetBin }).error(err)
                            }
                        })
                        return resolve()
                    } catch (error) {
                        this.logger.dump("error", error.toString())
                        verbosity.options({ method: `[RUNTIME]` }).error(`${error.message}`)
                        console.log(constables.ERROR_EXPORTED)
                    }
                }

                if (this.load.runCli) {
                    if (typeof targetBin === "undefined") {
                        if (this.args["_"].length >= 2) {
                            require('../internals/cli/dist')
                        }else {
                            repl.attachREPL()
                        }
                    }

                    return resolve()
                }
            } catch (error) {
                return reject(error)
            }
        })
    }
}

module.exports = {
    Runtime,
    packageManager,
    environmentFiles,
    net,
    repl,
    logger,
    constables,
    moduleLib,
    ...require("./helpers"),
}