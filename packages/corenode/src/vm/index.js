import fs from 'fs'
import path from 'path'
import vm from 'vm'

const RequireController = require("../require")
const objects = require("./objects")

let { verbosity, safeStringify, objectToArrayMap } = require('@corenode/utils')
verbosity = verbosity.options({ method: `[VM]`, time: false })

const builtInModules = {
    
}
const r0 = process.runtime[0]

export class EvalMachine {
    constructor(params) {
        if (typeof params.eval !== "string") {
            throw new Error(`Eval must be a string`)
        }
        if (typeof params.cwd === "undefined") {
            params.cwd = process.cwd()
        }

        this.params = params

        // maybe checking with fs is a terrible idea...
        try {
            if (fs.existsSync(this.params.eval)) {
                this.params.eval = fs.readFileSync(path.resolve(this.params.eval))
            }
        } catch (error) {
            verbosity.dump(error)
            verbosity.error(`Cannot check eval file/script > ${error.message}`)
        }

        // try to allocate to pool
        this.address = 0
        this.allocateNew()

        // define vm basics
        this.id = `EvalMachine_${this.params.id ?? this.address}`
        this.context = {}

        // reload cwd node_modules
        const localNodeModules = this.getNodeModules()
        this._modulesRegistry = { ...localNodeModules, ...builtInModules, ...this.params.aliaser }

        // set globals to jail
        this.jail.set('_modulesRegistry', this._modulesRegistry)
        this.jail.set('cwd', this.params.cwd)
        this.jail.set('_getProcess', () => safeStringify(process))
        this.jail.set('_getRuntime', (deep) => process.runtime[deep ?? 0])
        this.jail.set('global', global)
        this.jail.set('_import', (_module) => require("import-from")(path.resolve(this.params.cwd, 'node_modules'), _module))
        this.jail.set('_createModuleController', () => {
            return new RequireController.CustomNodeModuleController({...this._modulesRegistry})
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

        // create script and moduleController
        this.script = `
            var process = JSON.parse(_getProcess());
            var runtime = _getRuntime(0);
            var controller = runtime.controller;

            var module = _createModuleController();
            var require = module._require;

            ${this.params.eval}
        `

        // run the script
        this.run()
    }

    getNodeModules() {
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

        const node_modules = readDir(this.params.cwd, `node_modules`)

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
        if (typeof r0.vms !== "object") {
            r0.vms = {
                deep: 0,
                pool: {}
            }
        }

        while (typeof r0.vms.pool[this.address] !== "undefined") {
            this.address += 1
        }

        if (typeof r0.vms.pool[this.address] === "undefined") {
            r0.vms.pool[this.address] = this
        }

        r0.vms.deep = Object.keys(r0.vms.pool).length
    }

    run() {
        const vmscript = new vm.Script(this.script)

        // RUN SCRIPT
        vm.createContext(this.context)
        vmscript.runInContext(this.context)
    }

    jail = {
        get: () => {

        },
        set: (key, value) => {
            this.context[key] = value
        },
        del: () => {

        },
    }
}