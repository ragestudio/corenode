import fs from 'fs'
import path from 'path'
import filesize from 'filesize'
import { EventEmitter } from 'events'
import resolvePackagePath from 'resolve-package-path'
import * as babel from "@babel/core"
import * as compiler from '@corenode/builder/dist/lib'

const { Serializer } = require('./serialize.js')
const Jail = require('../classes/Jail').default
const RequireController = require("../require")
const objects = require("./objects")

let { verbosity, objectToArrayMap } = require('@corenode/utils')
const getVerbosity = () => verbosity.options({ method: `[VM]`, time: false })

const builtInModules = {
    "@babel/runtime": resolvePackagePath("@babel/runtime")
}

export class EvalMachine {
    constructor(params) {
        this.vmController = require("vm")

        if (typeof params === "undefined") {
            params = {}
        }
        if (typeof params.cwd === "undefined") {
            params.cwd = process.cwd()
        }

        this.params = params
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
                    this.params.eval = fs.readFileSync(path.resolve(this.params.eval))
                }
            }
        } catch (error) {
            getVerbosity().dump(error)
            getVerbosity().error(`Cannot check eval file/script > ${error.message}`)
        }

        try {
            // read vm script template
            const vmtFile = path.resolve(__dirname, 'vmt')
            const vmt = fs.readFileSync(vmtFile, 'utf8')

            // create script and moduleController
            this.vmt = String(vmt)
        } catch (error) {
            verbosity.dump(error)
            throw new Error(`Cannot load VMT file >> ${error.message}`)
        }

        // try to allocate to pool
        this.address = 0
        this.allocateNew()

        // define vm basics
        this.id = `EvalMachine_${this.params.id ?? this.address}`
        this.context = {}
        this.events = new EventEmitter()

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

        // reload cwd node_modules
        const globalNodeModules = this.getNodeModules(process.cwd())
        const localNodeModules = this.getNodeModules(this.params.cwd)
        this._modulesPaths = { ...localNodeModules, ...globalNodeModules, ...builtInModules, ...this.params.aliaser }

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

        this.jail.set('_import', (_module) => require("import-from")(this.params.cwd, _module), { configurable: false, writable: false, global: true })
        this.jail.set('expose', {}, { configurable: true, writable: false, global: true })
        this.jail.set('module', new RequireController.CustomModuleController({ ...this._modulesPaths }), { configurable: false, writable: false, global: true })
        //this.jail.set('require', new RequireController.CustomModuleController({ ...this._modulesRegistry }), { configurable: false, writable: false, global: true })

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
        this.vmController.createContext(this.context)

        // run vmt
        this.run(this.vmt, { babelTransform: false })

        if (typeof this.params.eval !== "undefined") {
            this.run(this.params.eval, { babelTransform: true })
        }
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

                        // create buffer for transform args to plain string
                        args.forEach((entry) => {
                            argsObj.push(this.serializer.serialize(entry))
                        })

                        const pass = JSON.stringify(argsObj)

                        return this.run(`
                        (function () {
                            var _argsParsed = self._deserialize(${pass})
                            if (_argsParsed){
                                return expose.${key}(..._argsParsed)
                            }

                            return expose.${key}()
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

        if (options.babelTransform) {
            exec = babel.transformSync(exec, { ...this.babelOptions, ...options.babelOptions }).code
        }

        const vmscript = new this.vmController.Script(exec)
        const _run = vmscript.runInContext(this.context)

        if (typeof callback === "function") {
            callback(_run)
        }
        return _run
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
                    getVerbosity().dump(error)
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