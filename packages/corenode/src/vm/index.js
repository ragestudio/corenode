import fs from 'fs'
import path from 'path'
import filesize from 'filesize'
import { EventEmitter } from 'events'
import * as babel from "@babel/core"
import * as compiler from '@corenode/builder/dist/lib'

const { Serializer } = require('./serialize.js')
const Jail = require('../classes/Jail').default
const RequireController = require("../require")
const objects = require("./objects")

let { verbosity, objectToArrayMap } = require('@corenode/utils')
const getVerbosity = () => verbosity.options({ method: `[VM]`, time: false })

const vmt = `
var controller = runtime.controller;
var require = module.createRequire(__getDirname());
var logger = runtime.logger.log;
var project = global.project;
`

export class EvalMachine {
    constructor(params) {
        this.params = params ?? {}
        this.vmController = require("vm")

        if (typeof this.params.cwd === "undefined") {
            this.params.cwd = process.cwd()
        }

        this.scriptOptions = {
            ...this.params.scriptOptions,
        }

        this.babelOptions = {
            plugins: compiler.defaultBabelPlugins,
            presets: [
                [
                    require.resolve('@babel/preset-env'),
                    {
                        targets: {
                            node: 6
                        }
                    },
                ],
            ]
        }

        // maybe checking with fs is a terrible idea...
        try {
            if (typeof this.params.eval !== "undefined") {
                if (fs.existsSync(this.params.eval)) {
                    this.params.file = this.params.eval
                }
            }
        } catch (error) {
            process.runtime.logger.dump("error", error)
            getVerbosity().error(`Cannot check eval file/script > ${error.message}`)
        }

        // read file/script
        try {
            if (typeof this.params.file !== "undefined") {
                if (fs.existsSync(this.params.file)) {
                    if (!path.extname(this.params.file)) {
                        this.params.file = path.resolve(this.params.file, 'index.js')
                    }

                    this.scriptOptions["filename"] = path.basename(this.params.file)

                    this.params.eval = fs.readFileSync(path.resolve(this.params.file))
                }
            }
        } catch (error) {
            process.runtime.logger.dump("error", error)
            getVerbosity().error(`[${this.params.file}] Cannot read file/script > ${error.message}`)
        }

        // try to allocate to pool
        this.address = 0
        this.allocateNew()

        // define vm basics
        this.id = `EvalMachine_${this.params.id ?? this.address}`
        this.context = {}
        this.events = new EventEmitter()
        this.errorHandler = this.params.onError

        if (!this.params.isolatedContext) {
            this.context = { ...this.context, ...global }
        }

        if (typeof this.params.context !== "undefined") {
            this.context = { ...this.context, ...this.params.context }
        }

        this.events.on(`destroyVM`, () => {
            if (typeof this._sendOnDestroy === "function") {
                this._sendOnDestroy(this.address)
            }
        })

        this.moduleAliases = { ...this.params.aliaser }

        // set symbols
        this._functionScapeSymbol = Symbol()

        // set globals to jail
        this.serializer = new Serializer()
        this.jail = new Jail()

        this.jail.set('selfThis', this, { configurable: false, writable: false, global: false })
        this.jail.set('self', this.jail.get(), { configurable: false, writable: false, global: true })
        this.jail.set('console', console, { global: true })
        this.jail.set('cwd', this.params.cwd, { configurable: false, writable: false, global: true })

        // set an process secure dispatcher
        this.jail.set('process', process, { configurable: false, writable: false, global: true })
        this.jail.set('runtime', process.runtime, { configurable: false, writable: false, global: true })

        this.jail.set('expose', {}, { configurable: true, writable: false, global: true })
        this.jail.set('module', new RequireController.CustomModuleController({ aliases: this.moduleAliases }), { configurable: false, writable: false, global: true })
        this.jail.set('__dirname', this.getDirname(), { configurable: false, writable: false, global: true })
        this.jail.set('__getDirname', () => this.getDirname(), { configurable: false, writable: false, global: true })

        this.jail.set('dispatcher', (...context) => this.dispatcher(...context), { configurable: false, writable: false, global: true })
        this.jail.set('run', (...context) => this.run(...context), { configurable: false, writable: false, global: true })
        this.jail.set('destroy', (...context) => this.destroy(...context), { configurable: false, writable: false, global: true })

        this.jail.set('_serialize', (...context) => this.serializer.serialize(...context), { configurable: false, writable: false, global: true })
        this.jail.set('_deserialize', (...context) => this.serializer.deserialize(...context), { configurable: false, writable: false, global: true })

        if (typeof (objects) === "object") {
            objectToArrayMap(objects).forEach((obj) => {
                const objectType = typeof obj.value

                switch (objectType) {
                    case "function": {
                        this.jail.set(obj.key, obj.value.bind(this), { global: true })
                        break
                    }

                    default: {
                        this.jail.set(obj.key, obj.value, { global: true })
                        break
                    }
                }
            })
        }

        // create context
        this.context = { ...this.context, ...this.jail.get() }
        this.context.global.runtime = process.runtime
        this.vmController.createContext(this.context)

        // run vmt
        this.run(vmt, { babelTransform: false })

        if (typeof this.params.eval !== "undefined") {
            this.run(this.params.eval, { babelTransform: true })
        }

        return this
    }

    dispatcher() {
        let obj = {}

        const exposers = this.context.expose
        const keys = Object.keys(exposers)

        keys.forEach((key) => {
            switch (typeof exposers[key]) {
                case "function": {
                    obj[key] = (...context) => {
                        let args = [...context]
                        let argsObj = []

                        args.forEach((entry) => {
                            argsObj.push(this.serializer.serialize(entry))
                        })

                        const pass = JSON.stringify(argsObj)

                        return this.run(`
                        (function () {
                            const _argsParsed = ${pass}

                            if (Array.isArray(_argsParsed) && _argsParsed.length > 0) {
                                return expose.${key}(..._argsParsed);
                            }

                            return expose.${key}();
                        }())`, { babelTransform: false })
                    }
                    break
                }
                case "object": {
                    obj[key] = this.run(`expose.${key}`, { babelTransform: false })
                    break
                }
                default: {
                    obj[key] = this.run(`expose.${key}`, { babelTransform: false })
                    break
                }
            }
        })

        return obj
    }

    getDirname() {
        if (typeof this.params.file !== "undefined") {
            return path.dirname(this.params.file)
        }

        return this.params.cwd
    }

    getNodeModules(origin) {
        let obj = {}

        function readDir(from, resolvePath) {
            if (typeof from !== "string") {
                return false
            }

            const directory = resolvePath ? path.resolve(from, resolvePath) : path.resolve(from)

            if (!fs.existsSync(directory)) {
                return false
            }

            return fs.readdirSync(directory).map((dir) => {
                return {
                    dir: dir,
                    _path: path.resolve(directory, dir)
                }
            })
        }

        const node_modules = readDir(origin, `node_modules`)

        if (Array.isArray(node_modules)) {
            node_modules.forEach((entry) => {
                const pkg = path.resolve(entry._path, 'package.json')
                if (fs.existsSync(pkg)) {
                    obj[entry.dir] = entry._path
                }
            })
        }

        return obj
    }

    allocateNew() {
        // create vms global object if not already created
        if (typeof process.runtime.vms !== "object") {
            process.runtime.vms = {
                deep: 0,
                pool: {}
            }
        }

        // iterate short addresses and increment local address until an free pool index is located
        while (typeof process.runtime.vms.pool[this.address] !== "undefined") {
            this.address += 1
        }

        // set pool address with `this`
        this.poolRef = process.runtime.vms.pool[this.address] = this

        // set deep with current pool length
        process.runtime.vms.deep = Object.keys(process.runtime.vms.pool).length
    }

    run(exec, options, callback) {
        if (typeof this.vmController === "undefined") {
            throw new Error(`vmController is not available (maybe destroyed)`)
        }

        if (typeof options !== "object") {
            options = {
                babelTransform: true
            }
        }

        try {
            if (options.babelTransform) {
                exec = babel.transformSync(exec, { ...this.babelOptions, ...options.babelOptions }).code
            }

            const vmscript = new this.vmController.Script(exec, this.scriptOptions)
            const _run = vmscript.runInContext(this.context)

            if (typeof callback === "function") {
                callback()
            }
            return _run
        } catch (error) {
            if (typeof this.errorHandler === "function") {
                return this.errorHandler(error)
            } else {
                throw error
            }
        }
    }

    runSync() {
        //
    }

    measureMemory(opts = {}) {
        return new Promise((resolve, reject) => {
            this.vmController.measureMemory({ mode: opts?.mode ?? 'detailed', execution: opts?.execution ?? 'eager' })
                .then((result) => {
                    if (opts?.humanize) {
                        let total = result.total
                        total.jsMemoryEstimate = filesize(total.jsMemoryEstimate)
                        total.jsMemoryRange = [...total.jsMemoryRange.map((range) => filesize(range))]

                        result.total = total
                    }
                    return resolve(result)
                })
                .catch((error) => {
                    process.runtime.logger.dump("error", error)
                    getVerbosity().error(error)
                    return reject(`Unavailable`)
                })
        })

    }

    onDestroy(fn) {
        if (typeof fn !== "function") {
            throw new Error(`[${typeof fn}] is not an valid type for "onDestroy"`)
        }
        this._sendOnDestroy = fn
    }

    destroy() {
        this.events.emit(`destroyVM`)

        delete this.poolRef
        delete process.runtime.vms.pool[this.address]
        delete this.vmController
    }
}