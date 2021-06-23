/**
 * corenode
 * @module corenode 
 */

const path = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')
const { verbosity, objectToArrayMap } = require("@corenode/utils")

//* PRIMORDIAL LIBRARIES
const dependencies = require('./dependencies')
const net = require('./net')
const repl = require('./repl')
const moduleLib = require('./module')
const logger = require('./logger')
const constables = require('./constables')

//* constants
const environmentFiles = global.environmentFiles ?? ['.corenode', '.corenode.js', '.corenode.ts', '.corenode.json']
global.npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

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

        //? set undefined globals
        if (typeof global._inited === "undefined") {
            global._inited = false
        }
        if (typeof global.isLocalMode === "undefined") {
            global.isLocalMode = false
        }
        if (typeof process.runtime !== "object") {
            process.runtime = {}
        }

        global._versionScheme = { mayor: 0, minor: 1, patch: 2 }

        // register primordials
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
        this.addons = null

        this.events = new EventEmitter()
        this.logger = new logger()

        // runtime preload
        this.preloadDone = false
        this.preloadEvents = ['init_addons_done']
        this.preloadPromises = []

        // set runtime objects
        const internalObjects = require('../internals/objects')
        if (typeof internalObjects === 'object') {
            objectToArrayMap(internalObjects).forEach((obj) => {
                this.createRuntimeObject(obj.key, obj.value)
            })
        }

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
        instance.isMain = require.main === module

        return instance
    }

    setEnvironment() {
        //* load dotenv
        require('dotenv').config()

        environmentFiles.forEach((file) => {
            const fromPath = path.resolve(process.cwd(), `./${file}`)

            if (fs.existsSync(fromPath)) {
                global._loadedEnvPath = fromPath

                try {
                    const runtimeEnv = JSON.parse(fs.readFileSync(fromPath, 'utf-8'))
                    global._env = {
                        ...runtimeEnv,
                        ...process.env
                    }
                } catch (error) {
                    console.error(`\n🆘  Error parsing runtime env > ${error.message} \n\n`)
                    console.error(error)
                }
            }
        })
    }

    setEvents() {
        this.events.addListener("cli_noCommand", () => {
            repl.attachREPL()
        })
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

    setPreloaders() {
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

    async init() {
        return new Promise(async (resolve, reject) => {
            //? register internal libs
            try {
                if (!global._inited) {
                    global._cli = {}
                    global._env = {}

                    this.setEnvironment()

                    //? set global aliases
                    this.modulesAliases = {
                        ...global._env.modulesAliases
                    }
                    this.modulesPaths = {
                        ...global._env.modulesPaths
                    }

                    global._packages = {
                        _engine: path.resolve(__dirname, '../package.json'),
                        _project: path.resolve(process.cwd(), 'package.json')
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

                    // create new addonController
                    const addonController = require("./addons").default
                    this.addons = new addonController()

                    // flag runtime as inited
                    global._inited = true
                }

                // warn local mode
                if (process.env.LOCAL_BIN == "true" && !global.isLocalMode) {
                    console.warn("\n\x1b[7m", constables.INVALID_LOCALMODE_FLAG, "\x1b[0m\n")
                } else if (global.isLocalMode) {
                    console.warn("\n\n\x1b[7m", constables.USING_LOCALMODE, "\x1b[0m\n\n")
                }

                let { targetBin, isLocalMode } = this.load
                if (isLocalMode) {
                    global.isLocalMode = true
                }

                //* set preloaders before load
                this.setPreloaders()

                //? fire preloaders
                await this.addons.checkDependencies()
                this.addons.init()

                //? await for them
                await Promise.all(this.preloadPromises)
                this.preloadDone = true

                //* load
                if (this.load.runCli) {
                    const args = require("yargs-parser")(process.argv)

                    runtime.args = args
                    process.parsedArgs = args
                    process.runtime.repl = repl

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
                                const { EvalMachine } = require('./vm')

                                new EvalMachine({
                                    file: targetBin,
                                    onError: (err) => {
                                        this.logger.dump("error", err.toString())
                                        verbosity.options({ method: "[script]", file: targetBin }).error(err)
                                    }
                                })
                            } catch (error) {
                                this.logger.dump("error", error.toString())
                                verbosity.options({ method: `[RUNTIME]` }).error(`${error.message}`)
                                console.log(constables.ERROR_EXPORTED)
                            }
                        } else {
                            return require('../internals/cli/dist')
                        }
                    } else {
                        repl.attachREPL()
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
    dependencies,
    environmentFiles,
    net,
    repl,
    logger,
    constables,
    moduleLib,
    ...require("./helpers"),
}