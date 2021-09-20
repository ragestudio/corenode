import fs from 'fs'
import path from 'path'
import filesize from 'filesize'
import { EventEmitter } from 'events'
import Serializer from './serialize.js'

const compilerLib = require('../transcompiler')
const vmlib = require("vm")
const { Timings } = require("../libs/timings")
const Jail = require('../classes/Jail').default
const moduleLib = require("../module")

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

        this.compilerOptions = {
            transforms: ["typescript", "jsx", "imports"]
        }

        this.refs = Object()
        this.depth = Number(0)
        this.pool = Object()

        global.eventBus.on(`vm_newAllocation`, this.updateDepth)
        global.eventBus.on(`vm_delAllocation`, this.updateDepth)
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
        // TODO
    }

    updateDepth = () => {
        this.depth = Object.keys(this.pool).length
    }

    measureMemory = (opts = {}) => {
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
            global.eventBus.emit(`vm_newAllocation`)

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
                global.eventBus.emit(`vm_delAllocation`)
                
                if (typeof callback === "function") {
                    callback()
                }
            } else {
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

        if (typeof this.params.eval !== "undefined") {
            if (fs.existsSync(this.params.eval)) {
                this.params.file = this.params.eval
            }
        }

        // allocate address with controller
        process.runtime.vmController.allocate(this, (address) => {
            this.address = address
        })

        // define vm basics
        this.name = this.params.name ?? `EvalMachine_${this.address}`
        this.context = {}
        this.events = new EventEmitter()
        this.errorHandler = this.params.onError
        this.runs = Number(0)
        this.locked = this.params.lock ?? false
        this.timings = new Timings({
            disabled: this.params.disableTimings,
            mutation: true,
            decorated: true,
            toFixedValue: 3,
            id: this.name
        })
        this.scriptOptions = {
            ...this.params.scriptOptions,
        }

        if (!this.params.excludeGlobalContext) {
            this.context = { ...this.context, ...global }
        }

        if (typeof this.params.context !== "undefined") {
            this.context = { ...this.context, ...this.params.context }
        }

        // read file/script
        this.timings.start(`readFile`)
        if (typeof this.params.file !== "undefined") {
            try {
                this.scriptOptions["filename"] = path.basename(this.params.file)
                this.params.eval = fs.readFileSync(this.params.file, "utf8")
            } catch (error) {
                process.runtime.logger.dump("error", error)
                getVerbosity().error(`Cannot read file/script > ${error.message}`)
            }
        } else {
            this.params.file = path.join(process.cwd(), "anonVM.js")
        }
        this.timings.stop(`readFile`)

        // init module controller
        this.timings.start(`createModuleController`)
        this.modulesAliases = { ...this.params.modulesAliases, ...global._env.modulesAliases }
        this.modulesPaths = [...this.params.modulesPaths ?? [], ...global._env.modulesPaths ?? []]
        this.moduleController = this.createModuleController()
        this.timings.stop(`createModuleController`)

        // set globals to jail
        this.timings.start(`setJail`)
        this.jail = this.createJail()
        this.timings.stop(`setJail`)

        // set objects
        this.timings.start(`setObjects`)
        objectToArrayMap(process.runtime.vmController.objects).forEach((obj) => {
            const objectType = typeof obj.value

            switch (objectType) {
                case "function": {
                    obj.value = obj.value.bind(this)
                    this.jail.set(obj.key, obj.value, { configurable: false, writable: false, global: true })
                    break
                }

                default: {
                    this.jail.set(obj.key, obj.value, { global: true })
                    break
                }
            }
        })
        this.timings.stop(`setObjects`)


        // set events
        this.timings.start(`setEvents`)
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
            console.warn(`VM[${this.address}][${this.name}] Destroy has been rejected > ${reason ?? "unknown"}`)
        })
        this.timings.stop(`setEvents`)

        // create context
        this.timings.start(`createContext`)
        this.context = { ...this.context, ...this.jail.get(), ...process.runtime.vmController.defaultJail.get() }
        this.timings.stop(`createContext`)

        // set global
        this.timings.start(`setGlobals`)
        this.context.global = {
            _import: moduleLib.createScopedRequire(this.moduleController, this.getDirname()),
            _env: global._env,
            runtime: process.runtime
        }
        this.timings.stop(`setGlobals`)

        this.events.emit("ready")

        // run first script, sending vmt for vm initialization
        this.timings.start(`runTemplateInit`)
        this.run(vmt, { compile: false })
        this.timings.stop(`runTemplateInit`)

        this.timings.start(`runFirstEval`)
        if (typeof this.params.eval !== "undefined") {
            this.run(this.params.eval, { compile: true })
        }
        this.timings.stop(`runFirstEval`)
        return this
    }

    createJail() {
        const jail = new Jail()

        jail.set(
            'module',
            this.moduleController,
            { configurable: true, writable: true, global: true }
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
        jail.set(
            'self',
            jail.get(),
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
                            argsObj.push(Serializer.serialize(entry))
                        })

                        const pass = JSON.stringify(argsObj)

                        return this.run(`
                        (function () {
                            const _argsParsed = ${pass}

                            if (Array.isArray(_argsParsed) && _argsParsed.length > 0) {
                                return expose.${key}(..._argsParsed);
                            }

                            return expose.${key}();
                        }())`, { compile: false })
                    }
                    break
                }
                case "object": {
                    obj[key] = this.run(`expose.${key}`, { compile: false })
                    break
                }
                default: {
                    obj[key] = this.run(`expose.${key}`, { compile: false })
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
        this.timings.start(`lastTranscompile`)
        exec = compilerLib.transform(exec, { ...process.runtime.vmController.compilerOptions, ...options }).code
        this.timings.stop(`lastTranscompile`)

        return exec
    }

    run = (exec, options, callback) => {
        if (typeof options !== "object") {
            options = {
                compile: true
            }
        }

        try {
            if (options.compile) {
                exec = this.transformCode(exec, options.compilerOptions)
            }

            this.timings.start(`lastCreateScript`)
            const vmscript = new vmlib.Script(exec, this.scriptOptions)
            this.timings.stop(`lastCreateScript`)

            this.timings.start(`lastRun`)
            const _runContext = vmlib.createContext(this.context)
            const _run = vmscript.runInContext(_runContext)
            this.timings.stop(`lastRun`)

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