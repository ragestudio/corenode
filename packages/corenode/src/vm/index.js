import fs from 'fs'
import path from 'path'
import filesize from 'filesize'
import { EventEmitter } from 'events'
import resolvePackagePath from 'resolve-package-path'

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

        // try to allocate to pool
        this.address = 0
        this.allocateNew()

        // define vm basics
        this.id = `EvalMachine_${this.params.id ?? this.address}`
        this.context = {}
        this.events = new EventEmitter()

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
        this._modulesRegistry = { ...localNodeModules, ...globalNodeModules, ...builtInModules, ...this.params.aliaser }
        
        // set globals to jail
        this.jail.set('self', this)
        this.jail.set('_modulesRegistry', this._modulesRegistry)
        this.jail.set('cwd', this.params.cwd)
        this.jail.set('_getProcess', () => process)
        this.jail.set('_getRuntime', () => process.runtime)
        this.jail.set('global', global)
        this.jail.set('_import', (_module) => require("import-from")(path.resolve(this.params.cwd, 'node_modules'), _module))
        this.jail.set('expose', {})
        this.jail.set('_createModuleController', () => {
            return new RequireController.CustomNodeModuleController({ ...this._modulesRegistry })
        })
        this.jail.set('log', (...args) => {
            const v = verbosity.options({ method: `[${this.id}]` })
            v.log(...args)
        })

        if (typeof (objects) === "object") {
            objectToArrayMap(objects).forEach((obj) => {
                this.jail.set(obj.key, obj.value)
            })
        }

        try {
            // read vm script template
            const vmtFile = path.resolve(__dirname, 'vmt')
            const vmt = fs.readFileSync(vmtFile, 'utf8')

            // create script and moduleController
            this.script = String(vmt)
            if (typeof this.params.eval !== "undefined") {
                this.script = this.script + this.params.eval
            }
        } catch (error) {
            verbosity.dump(error)
            throw new Error(`Cannot load VMT file >> ${error.message}`)
        }

        // create context
        this.vmController.createContext(this.context)

        // run template
        this.run(this.script)
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
                        this.run(`expose.${key}(${args.join()})`)
                    }
                    break
                }

                default: {
                    obj[key] = this.run(`expose.${key}`)
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

    run(exec, callback) {
        if (typeof this.vmController === "undefined") {
            throw new Error(`vmController is not available (maybe destroyed)`)
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

    jail = {
        get: (key) => {
            return this.context[key]
        },
        set: (key, value) => {
            this.context[key] = value
        },
        del: (key) => {
            delete this.context[key]
        },
    }
}