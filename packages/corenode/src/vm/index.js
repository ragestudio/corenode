import fs from 'fs'
import path from 'path'
import filesize from 'filesize'
import { EventEmitter } from 'events'
import Serializer from './serialize.js'

import * as babel from "@babel/core"
import * as compiler from '@corenode/builder/dist/lib'

const vmlib = require("vm")
const Jail = require('../classes/Jail').default
const moduleLib = require("../module")
const { Observable } = require("../observer")

let { verbosity, objectToArrayMap } = require('@corenode/utils')
const getVerbosity = () => verbosity.options({ method: `[VM]`, time: false })


const vmt = `
var require = module.createRequire(__getDirname());
var _import = global._import;
`

export class VMObject {

}

export class VMController {
    constructor() {
        this.defaultJail = this.createDefaultJail()
        this.objects = this.getObjects()

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

        this.refs = Observable.from({})
        this.deep = Number(0)
        this.pool = Object()

        this.refs.observe(this.onRefsMutation)
    }

    getObjects() {
        let objects = {}

        const runtimeObjects = process.runtime.objects
        if (typeof runtimeObjects === "object") {
            objects = { ...objects, ...runtimeObjects }
        }

        return objects
    }

    createDefaultJail() {
        const jail = new Jail()

        jail.set('process', process, { configurable: false, writable: false, global: true })
        jail.set('runtime', process.runtime, { configurable: false, writable: false, global: true })
        jail.set('controller', process.runtime.controller, { configurable: false, writable: false, global: true })
        jail.set('_serialize', (...context) => Serializer.serialize(...context), { configurable: false, writable: false, global: true })
        jail.set('_deserialize', (...context) => Serializer.deserialize(...context), { configurable: false, writable: false, global: true })
        jail.set('console', console, { global: true })
        jail.set('expose', {}, { configurable: true, writable: false, global: true })

        return jail
    }

    createVMContext = () => {

    }

    onRefsMutation = (mutation) => {
        //update deep
        this.deep = Object.keys(this.pool).length
        console.log(`CurrentDeep: ${this.deep}`)
    }

    measureMemory(opts = {}) {
        return new Promise((resolve, reject) => {
            vmlib.measureMemory({ mode: opts?.mode ?? 'detailed', execution: opts?.execution ?? 'eager' })
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

    allocate(evalMachine, callback) {
        if (evalMachine instanceof EvalMachine) {
            let address = Number(0)

            // iterate short addresses and increment local address until an free pool index is located
            while (typeof this.pool[address] !== "undefined") {
                address += 1
            }

            this.pool[address] = evalMachine
            this.refs[address] = () => {
                return this.pool[address]
            }

            return callback(address)
        }
    }

    destroy(address, callback) {
        if (this.pool[address] instanceof EvalMachine) {
            const vm = this.pool[address]

            if (!vm.locked) {
                vm.events.emit(`beforeDestroy`)

                delete this.pool[address]
                delete this.refs[address]

                if (typeof callback === "function") {
                    callback()
                }
            }else {
                vm.events.emit(`destroyRejected`, `VM Is locked`)
            }
        }
    }
}

export class EvalMachine {
    constructor(params) {
        if (typeof process.runtime.vmController !== "object") {
            throw new Error(`Runtime has not an vmController`)
        }
        this.params = { ...params }

        if (typeof this.params.cwd === "undefined") {
            this.params.cwd = process.cwd()
        }

        this.scriptOptions = {
            ...this.params.scriptOptions,
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
            } else {
                this.params.file = path.join(process.cwd(), "anonVM.js")
            }
        } catch (error) {
            process.runtime.logger.dump("error", error)
            getVerbosity().error(`[${this.params.file}] Cannot read file/script > ${error.message}`)
        }

        // allocate address with controller
        process.runtime.vmController.allocate(this, (address) => {
            this.address = address
        })

        // define vm basics
        this.id = `EvalMachine_${this.params.id ?? this.address}`
        this.context = {}
        this.events = new EventEmitter()
        this.errorHandler = this.params.onError
        this.runs = Number(0)
        this.locked = this.params.lock ?? false

        if (!this.params.excludeGlobalContext) {
            this.context = { ...this.context, ...global }
        }

        if (typeof this.params.context !== "undefined") {
            this.context = { ...this.context, ...this.params.context }
        }

        // set objects
        objectToArrayMap(process.runtime.vmController.objects).forEach((obj) => {
            const objectType = typeof obj.value

            switch (objectType) {
                case "function": {
                    obj.value = obj.value.bind(this)
                    break
                }

                default: {
                    this.jail.set(obj.key, obj.value, { global: true })
                    break
                }
            }
        })

        // init module controller
        this.modulesAliases = { ...this.params.modulesAliases, ...global._env.modulesAliases }
        this.modulesPaths = [...this.params.modulesPaths ?? [], ...global._env.modulesPaths ?? []]
        this.moduleController = this.createModuleController()

        // set events
        this._sendBeforeDestroy = null
        this._sendOnDestroy = null

        this.events.on(`beforeDestroy`, () => {
            if (typeof this._sendBeforeDestroy === "function") {
                this._sendBeforeDestroy(this.address)
            }
        })
        this.events.on(`destroyed`, () => {
            if (typeof this._sendOnDestroy === "function") {
                this._sendOnDestroy(this.address)
            }
        })
        this.events.on(`destroyRejected`, (reason) => {
            console.warn(`VM[${this.address}] Destroy has been rejected > ${reason ?? "unknown"}`)
        })

        // set globals to jail
        this.jail = this.createJail()

        // create context
        this.context = { ...this.context, ...this.jail.get(), ...process.runtime.vmController.defaultJail.get() }

        // set global
        this.context.global = {
            _import: moduleLib.createScopedRequire(this.moduleController, this.getDirname()),
            _env: global._env,
            project: global.project,
            runtime: process.runtime
        }

        this.events.emit("ready")

        // run first script, sending vmt for vm initialization
        this.run(vmt, { babelTransform: false })
        if (typeof this.params.eval !== "undefined") {
            this.run(this.params.eval, { babelTransform: true })
        }
        return this
    }

    createJail() {
        const jail = new Jail()

        jail.set(
            'selfThis',
            this,
            { configurable: false, writable: false, global: false }
        )
        jail.set(
            'self',
            jail.get(),
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            'module',
            this.moduleController,
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            'cwd',
            this.params.cwd,
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            '__dirname',
            this.getDirname(),
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            '__getDirname',
            this.getDirname,
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            'dispatcher',
            this.dispatcher,
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            'run', (...context) =>
            this.run(...context),
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            'destroy', (...context) =>
            this.destroy(...context),
            { configurable: false, writable: false, global: true }
        )
        jail.set(
            '_vmLock',
            (to) => {
                if (typeof to !== "undefined") {
                    this.locked = Boolean(to)
                } else {
                    this.locked = !this.locked
                }
            },
            { configurable: false, writable: false, global: true }
        )

        return jail
    }

    createModuleController = () => {
        return new moduleLib.moduleController({ filename: this.params.file, aliases: this.modulesAliases, paths: this.modulesPaths })
    }

    dispatcher = () => {
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

    getDirname = () => {
        if (typeof this.params.file !== "undefined") {
            return path.dirname(this.params.file)
        }

        return this.params.cwd
    }

    do = (fn, option, callback) => {
        let script = `
            (async function(){
                const _ = ${fn.toString()}
                _.call()
            }())
        `

        this.run(script, option, callback)
    }

    doSync = () => {
        let script = `
            (function(){
                const _ = ${fn.toString()}
                _.call()
            }())
        `

        this.run(script, option, callback)
    }

    transformCode = (exec, options = {}) => {
        const controllerBabelOptions = process.runtime.vmController.babelOptions
        exec = babel.transformSync(exec, { ...controllerBabelOptions, ...options }).code

        return exec
    }

    run = (exec, options, callback) => {
        if (typeof options !== "object") {
            options = {
                babelTransform: true
            }
        }

        try {
            if (options.babelTransform) {
                exec = this.transformCode(exec, options.babelOptions)
            }

            const vmscript = new vmlib.Script(exec, this.scriptOptions)
            const _run = vmscript.runInContext(vmlib.createContext(this.context))

            if (typeof callback === "function") {
                callback(_run)
            }

            this.runs += 1

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

    beforeDestroy = (fn) => {
        if (typeof fn !== "function") {
            throw new Error(`[${typeof fn}] is not an valid type for "beforeDestroy"`)
        }
        this._sendBeforeDestroy = fn
    }

    onDestroy = (fn) => {
        if (typeof fn !== "function") {
            throw new Error(`[${typeof fn}] is not an valid type for "onDestroy"`)
        }
        this._sendOnDestroy = fn
    }

    destroy = () => {
        process.runtime.vmController.destroy(this.address, () => {
            this.events.emit(`destroyed`)
        })
    }
}