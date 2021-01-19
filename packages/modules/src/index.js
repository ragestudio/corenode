import fs from 'fs'
import path from 'path'

let { verbosity, objectToArrayMap } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: `nodecore_modules`, time: false })

let _modules = {}
let _libraries = {}

const codecRegistry = 'utf-8'

const builtInLibraries = path.resolve(__dirname, "libraries")
const modulesPath = path.resolve(process.cwd(), 'nodecore_modules')
const modulesRegistry = path.resolve(modulesPath, `.modules.json`)

export function readModules() {
    let names = []

    if (fs.existsSync(modulesPath)) {
        fs.readdirSync(modulesPath).filter((pkg) => pkg.charAt(0) !== '.').forEach((_module) => {
            names.push(_module)
        })
    }
    
    return names
}

export function readModule(moduleName, builtIn = false) {
    const _moduleDir = path.resolve((builtIn? builtInLibraries : modulesPath), `${moduleName}`)
    const initializator = path.resolve(_moduleDir, `./index.js`)
        
    if (!fs.existsSync(initializator)) {
        throw new Error(`Initializator not found!`)
    }
    const _module = require(initializator)

    let { type, requires } = _module
    const firstOrder = !requires ? true : false // if module doesnt requires modules is considered first level
    const isLib = type === "lib" ?? false

    return {
        ..._module,
        _lib: isLib ?? false,
        dir: _moduleDir,
        firstOrder,
    }
}

export function initRegistry(forceWriteLink) {
    try {
        if (!fs.existsSync(modulesRegistry)) {
            forceWriteLink = true
        }

        if (forceWriteLink) {
            let pkgs = {}
            readModules().forEach((moduleName) => {
                try {
                    const _module = readModule(moduleName)
                    const { _lib, dir, firstOrder } = _module

                    pkgs[_module.pkg] = {
                        _lib, dir, firstOrder
                    }
                } catch (error) {
                    verbosity.error(`Failed at linking module > [${moduleName}] >`)
                    console.log(error)
                }
            })
            fs.writeFileSync(modulesRegistry, JSON.stringify(pkgs, null, 2), codecRegistry)
        }

        let _registry = JSON.parse(fs.readFileSync(modulesRegistry, codecRegistry))

        if (fs.existsSync(builtInLibraries)) {
            fs.readdirSync(builtInLibraries).filter((pkg) => pkg.charAt(0) !== '.').forEach((_module) => {
                _libraries[_module] = {
                    _builtIn: true
                }
            })
        }
        objectToArrayMap(_registry).forEach((entry) => {
            const isLib = entry.value._lib

            if (isLib) {
                _libraries[entry.key] = entry.value
            } else {
                _modules[entry.key] = entry.value
            }
        })
    } catch (error) {
        verbosity.error(`Failed at registry initialization >`)
        console.log(error)
    }
}


// initialize Modules & Libraries
try {
    initRegistry()
    objectToArrayMap(_modules).forEach((entry) => {
        const moduleName = entry.key
        try {
            let _lib = {}
            const _module = readModule(moduleName)

            if (typeof(_module.lib) !== "undefined") {
                if (_libraries[_module.lib]) {
                    const isBuiltIn = _libraries[_module.lib]._builtIn
                    _lib = readModule(_module.lib, isBuiltIn)
                }
            }

            if (typeof(_module.init) !== "undefined") {
                if (typeof(_module.init) !== "function") {
                    throw new Error(`Init not valid function`)
                }
                _module.init(_lib._load ?? _lib)
            }

        } catch (error) {
            verbosity.error(`Failed at module initialization > [${moduleName}] >`)
            console.log(error)
        }
    })

} catch (error) {
    verbosity.error(`Fatal error at initialization >`)
    console.log(error)
}
