/**
 * corenode
 * @module corenode 
 */
const enginePkg = require("./package.json")
const path = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')

//* PRIMORDIAL LIBRARIES
const moduleLib = require('./module')
const logger = require('./logger')
const constables = require('./constables')

//* constants
const environmentFiles = global.environmentFiles ?? ['.corenode', '.corenode.js', '.corenode.ts', '.corenode.json']
class Runtime {
    constructor(params = {}) {
        this.initialized = false
        this.params = { ...params }

        this.events = new EventEmitter()
        this.logger = new logger()

        // disabler
        this.disableCheckDependencies = this.params.disableCheckDependencies ?? false
        this.disabledAddons = this.params.disableAddons ?? false

        // aliaser
        this.modulesAliases = {}
        this.modulesPaths = {}

        // runtime objects and controller
        this.objects = {}
        this.controller = {}

        // runtime controllers
        this.vmController = null
        this.addonsController = null

        // runtime preload
        this.preloadDone = false
        this.preloadPromises = []

        //? set undefined globals
        if (typeof global.isLocalMode === "undefined") {
            global.isLocalMode = false
        }
        if (typeof process.runtime !== "object") {
            process.runtime = {}
        }
        if (typeof global.eventBus === "undefined") {
            global.eventBus = new EventEmitter()
        }
        if (typeof process.cli === "undefined") {
            process.cli = {
                custom: []
            }
        }

        if (this.params.cwd) {
            if (!path.isAbsolute(this.params.cwd)) {
                this.params.cwd = path.resolve(this.params.cwd)
            }

            process.chdir(this.params.cwd)
        }

        this.registerModulesAliases({
            "factory": path.resolve(__dirname, 'factory'),
            "filesystem": path.resolve(__dirname, 'filesystem'),
            "path": path.resolve(__dirname, 'path'),
            "@@addons": path.resolve(__dirname, 'addons'),
            "@@classes": path.resolve(__dirname, 'classes'),
            "@@vm": path.resolve(__dirname, 'vm'),
            "@@libs": path.resolve(__dirname, 'libs'),
            "@@constables": path.resolve(__dirname, 'constables'),
            "@@internals": path.resolve(__dirname, 'internals'),
            "@@transcompiler": path.resolve(__dirname, 'transcompiler'),
        })

        const runtimeObjects = this.getRuntimeObjects()
        if (typeof runtimeObjects === 'object') {
            const keys = Object.keys(runtimeObjects)
            keys.forEach((key) => {
                const obj = runtimeObjects[key]
                this.appendObjectToRuntime(obj.key, obj.value)
            })
        }

        const runtimeEvents = this.getRuntimeEvents()
        if (Array.isArray(runtimeEvents)) {
            runtimeEvents.forEach((_case) => {
                this.events.addListener(_case.on, _case.do)
            })
        }

        this.loadHelpers()
        this.loadEnvironment()
        this.handleLocalMode()

        this.modulesAliases = {
            ...process.env.modulesAliases,
            ...this.modulesAliases,
        }
        this.modulesPaths = {
            ...process.env.modulesPaths,
            ...this.modulesPaths,
        }

        global.runtime = process.runtime = this.overrideRuntimeGlobalContext(this)
        global.loadLib = this.loadLib

        return this
    }

    //* GET
    get = {
        environmentFiles: () => environmentFiles,
        paths: {
            _env: () => global._loadedEnvPath ?? path.resolve(process.cwd(), '.corenode'),
            _src: () => path.resolve(__dirname),
        }
    }

    getRuntimeEvents = () => {
        const events = []

        try {
            const internalEvents = require('./events')
            // TODO: load custom events from project
            if (Array.isArray(internalEvents)) {
                internalEvents.forEach((event) => {
                    events.push(event)
                })
            }
        } catch (error) {
            this.logger.dump(error)
            console.error(`Failed to get events >`, error.message)
        }

        return events
    }

    getRuntimeObjects = () => {
        let objects = {}

        try {
            const internalObjects = require('./internals/objects')
            // TODO: load custom objects from project
            objects = internalObjects
        } catch (error) {
            this.logger.dump(error)
            console.error(`Failed to get objects >`, error.message)
        }

        return objects
    }

    //* APPENDS
    appendObjectToRuntime = (key, thing) => {
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

    appendToCli = (entries) => {
        let commands = []

        if (Array.isArray(entries)) {
            commands = entries
        } else if (typeof entries === "object") {
            commands.push(entries)
        }

        commands.forEach((entry) => {
            if (typeof process.cli.custom === "undefined") {
                process.cli.custom = []
            }

            let fn = Boolean(entry.useThisContext) ? (...args) => entry.exec(this, ...args) : entry.exec
            if (Boolean(entry.bindThis)) {
                fn = fn.bind(this)
            }

            process.cli.custom.push({ ...entry, exec: fn })
        })
    }

    appendToPreloader = (event) => {
        this.preloadPromises.push(event)
    }

    //* SET
    setEventToPreloader = (event) => {
        this.appendToPreloader(new Promise((res, rej) => {
            this.events.on(event, () => {
                return res()
            })
        }))
    }

    //* REGISTER
    registerModulesAliases = (mutation) => {
        if (typeof mutation === "object") {
            this.modulesAliases = {
                ...this.modulesAliases,
                ...mutation
            }
        }

        module = this.overrideModuleController(module)
    }

    registerModulesPaths = (mutation) => {
        if (typeof mutation === "object") {
            this.modulesPaths = {
                ...this.modulesPaths,
                ...mutation
            }
        }

        module = this.overrideModuleController(module)
    }

    //* OVERRIDES
    overrideModuleController = (instance = {}) => {
        return moduleLib.override(instance, { aliases: this.modulesAliases, paths: this.modulesPaths })
    }

    overrideRuntimeGlobalContext(instance = {}) {
        if (typeof instance.manifests === "undefined") {
            instance.manifests = Object()
        }
        if (typeof instance.project === "undefined") {
            instance.project = Object()
        }

        instance.manifests.engine = path.resolve(__dirname, 'package.json')
        instance.manifests.project = path.resolve(process.cwd(), 'package.json')

        instance.project._envpath = this.get.paths._env()
        instance.project._runtimeSource = this.get.paths._src()

        instance.version = enginePkg.version

        return instance
    }

    //* HANDLERS
    handleLocalMode = () => {
        process.runtime.isLocalMode = false

        try {
            const rootPkg = this.helpers.getRootPackage()

            if (rootPkg.name.includes("corenode") && process.env.LOCAL_BIN == "true") {
                process.runtime.isLocalMode = true
                global.eventBus.emit('local_mode')
            }
        } catch (error) {
            // terrible
        }

        // warn local mode
        if (process.env.LOCAL_BIN == "true" && !process.runtime.isLocalMode) {
            console.warn("\n\x1b[7m", constables.INVALID_LOCALMODE_FLAG, "\x1b[0m\n")
        } else if (process.runtime.isLocalMode) {
            console.warn("\n\n\x1b[7m", constables.USING_LOCALMODE, "\x1b[0m\n\n")
        }
    }

    //* LOADERS
    loadHelpers = () => {
        this.helpers = require("@corenode/helpers")
    }

    loadEnvironment = () => {
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

    //* INITIALIZERS
    initialize = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                await Promise.all(this.preloadPromises)
                this.preloadDone = true
                this.events.emit('preload_done', true)

                //* create and initialize runtime controllers
                const { VMController } = require('./vm')
                this.vmController = new VMController()

                const { addonsController } = require("./addons")
                this.addonsController = new addonsController()

                //* call initializes
                // await this.addonsController.checkDependencies() // temporally disabled
                await this.addonsController.init()

                // set runtime as initialized
                this.initialized = true
                this.events.emit('initialized', true)

                return resolve()
            } catch (error) {
                return reject(error)
            }
        })
    }

    target = (target) => {
        return new Promise((resolve, reject) => {
            try {
                //* LOAD
                const { EvalMachine } = require("./vm")
                let { targetBin } = target ?? this.params
                const withoutBin = process.argv.slice(2)

                if (typeof withoutBin[0] !== "undefined") {
                    //* Try to resolve target bin
                    let fileFromArgs = path.resolve(withoutBin[0])

                    const isFile = () => fs.lstatSync(fileFromArgs).isFile()
                    const isSymlink = () => fs.lstatSync(fileFromArgs).isSymbolicLink()
                    const isDirectory = () => fs.lstatSync(fileFromArgs).isDirectory()

                    if (fs.existsSync(fileFromArgs)) {
                        // try to resolve index
                        if (isDirectory()) {
                            const directories = fs.readdirSync(fileFromArgs)

                            if (directories.length > 1) {
                                directories.forEach((file) => {
                                    // try to match index
                                    const fileBasename = path.basename(file)
                                    const fileExtension = path.extname(fileBasename)
                                    const withoutExtension = fileBasename.substring(0, fileBasename.length - fileExtension.length)

                                    if (withoutExtension === "index") {
                                        fileFromArgs = path.resolve(fileFromArgs, fileBasename)
                                    }
                                })
                            } else {
                                fileFromArgs = path.resolve(fileFromArgs, directories[0])
                            }
                        }

                        // check again and override
                        if (fs.existsSync(fileFromArgs)) {
                            if (isSymlink() || isFile()) {
                                targetBin = fileFromArgs
                            }
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
                            onError: (error) => {
                                this.logger.dump("error", error.toString())
                                console.error(`[RUNTIME SCRIPT VM] > ${error.message}`)
                                console.log(constables.ERROR_EXPORTED)
                            }
                        })
                    } catch (error) {
                        this.logger.dump("error", error.toString())
                        console.error(`[RUNTIME SCRIPT] > ${error.message}`)
                        console.log(constables.ERROR_EXPORTED)
                    }
                } else {
                    require('./repl').attachREPL()
                }

                return resolve()
            } catch (error) {
                return reject(error)
            }
        })
    }
}

function fatalCrash(error) {
    if (!error) {
        return false
    }

    if (typeof global.eventBus !== "undefined") {
        global.eventBus.emit('fatalCrash', error)
    }

    process.exit(1)
}

function runInNewRuntime(fn) {
    const runtime = new Runtime()
    if (typeof fn === "function") {
        fn.bind(runtime)(runtime)
    }

    return runtime
}

module.exports = {
    events: {
        fatalCrash
    },
    runInNewRuntime,
    Runtime,
    environmentFiles,
    logger,
    constables,
}