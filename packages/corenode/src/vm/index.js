import fs from 'fs'
import path from 'path'
import vm from 'vm'

const RequireController = require("../require")

let { verbosity, safeStringify } = require('@corenode/utils')
verbosity = verbosity.options({ method: `[VM]`, time: false })

const builtInModules = {
    
}
const r0 = process.runtime[0]

export class EvalMachine {
    constructor(params) {
        if (typeof params.eval !== "string") {
            throw new Error(`Eval must be a string`)
        }

        // maybe checking with fs is a terrible idea...
        try {
            if (fs.existsSync(params.eval)) {
                params.eval = fs.readFileSync(path.resolve(params.eval))
            }
        } catch (error) {
            verbosity.dump(error)
            verbosity.error(`Cannot check eval file/script > ${error.message}`)
        }

        // try to allocate to pool
        this.address = 0
        this.allocateNew()

        // define vm basics
        this.id = `EvalMachine_${params.id ?? this.address}`
        this.context = {}

        // set globals to jail
        this.jail.set('cwd', process.cwd())
        this.jail.set('_getProcess', () => safeStringify(process))
        this.jail.set('_getRuntimeGlobal', (deep) => safeStringify(process.runtime[deep ?? 0]))

        this.jail.set('_createModuleController', () => {
            return new RequireController.CustomNodeModuleController({ ...builtInModules, ...params.aliaser })
        })
        this.jail.set('log', (...args) => {
            const v = verbosity.options({ method: `[${this.id}]` })
            v.log(...args)
        })

        // create script and moduleController
        this.script = `
            var process = JSON.parse(_getProcess());
            var runtime0 = JSON.parse(_getRuntimeGlobal(0));

            var module = _createModuleController();
            var require = module._require;

            ${params.eval}
        `

        // run the script
        this.run()
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