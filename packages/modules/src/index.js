import fs from 'fs'
import path from 'path'
import logDump from '@nodecorejs/log'
import { getRootPackage, proyectPkgPath, isDependencyInstalled, addDependency } from '@nodecorejs/dot-runtime'

let { verbosity, objectToArrayMap } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: `nodecore_modules`, time: false })

let _modules = {}
let _libraries = {}
let _loaded = []

const codecRegistry = 'utf-8'

if (!global.nodecore_modules) {
    global.nodecore_modules = {}
}

const builtInLibraries = global.nodecore_modules.builtInLibraries = path.resolve(__dirname, "libraries")
const modulesPath = global.nodecore_modules.modulesPath = path.resolve(process.cwd(), 'nodecore_modules')
const modulesRegistry = global.nodecore_modules.modulesRegistry = path.resolve(modulesPath, `.modules.json`)

export function readRegistry() {
    let _registry = {}
    try {
        if (fs.existsSync(modulesRegistry)) {
            const read = fs.readFileSync(modulesRegistry, codecRegistry)
            if (read) {
                _registry = JSON.parse(read)
            }
        }
    } catch (error) {
        verbosity.error(`Failed to read registry >`, err.message)
    }

    return _registry
}

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
    const _moduleDir = path.resolve((builtIn ? builtInLibraries : modulesPath), `${moduleName}`)
    const initializator = path.resolve(_moduleDir, `./index.js`)

    if (!fs.existsSync(initializator)) {
        throw new Error(`Initializator not found!`)
    }
    const _module = require(initializator)

    let { type, requires, libs } = _module
    const firstOrder = !libs ? true : false // if module doesnt requires libraries is considered first level
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
        let _registry = readRegistry()
        
        if (!fs.existsSync(modulesRegistry)) {
            fs.mkdirSync(modulesPath, { recursive: true })
        }

        linkAllModules(forceWriteLink ?? false)

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
        verbosity.error(`Failed at registry initialization >`, err.message)
        logDump(error)
    }
}

export function writeModule(name, filename, _module) {
    return new Promise((resolve, reject) => {
        try {
            const moduleDir = `${modulesPath}/${name}`
            if (!fs.existsSync(moduleDir)) {
                fs.mkdirSync(moduleDir, { recursive: true })
            }
    
            fs.writeFileSync(`${moduleDir}/${filename ?? "index.js"}`, _module, {
                encoding: codecRegistry,
                recursive: true
            })
            resolve(true)
        } catch (error) {
            const errStr = `Failed at writting module >`

            logDump(errStr, error)
            reject(error)
        }
    })
}

export function writeModuleRegistry(_module) {
    try {
        let registry = readRegistry()
        const { _lib, dir, firstOrder, node_modules } = _module

        if (node_modules) {
            objectToArrayMap(node_modules).forEach((dep) => {
                const isInstalled = isDependencyInstalled(dep.key) ? true : false
                if (!isInstalled) {
                    addDependency(dep, true)
                }
            })
        }

        registry[_module.pkg] = {
            _lib, dir, firstOrder
        }

        fs.writeFileSync(modulesRegistry, JSON.stringify(registry, null, 2), {
            encoding: codecRegistry,
            recursive: true
        })
    } catch (error) {
        verbosity.error(`Failed at writting registry >`, error.message)
        logDump(error)
    }
}

export function linkAllModules(force = false) {
    let _registry = readRegistry()

    readModules().forEach((moduleName) => {
        try {
            if (!_registry[moduleName] || force) {
                writeModuleRegistry(readModule(moduleName))
            }
        } catch (error) {
            verbosity.error(`Failed at linking module > [${moduleName}] >`, err.message)
            logDump(error)
        }
    })
}

// initialize Modules & Libraries
export function init(params) {
    try {
        initRegistry(params?.force ?? false)
        objectToArrayMap(_modules).forEach((entry) => {
            const moduleName = entry.key
            if (_loaded.includes(moduleName)) return // Avoid load multi time per runtime
            
            try {
                let loadLibrary = {}

                const _module = readModule(moduleName)
                let librariesIncludes = ["builtIn"] // by default load `builtIn` library

                if (typeof (_module.libs) !== "undefined") {
                    if (Array.isArray(_module.libs)) {
                        _module.libs.forEach((lib) => {
                            if (!librariesIncludes.includes(lib)) {
                                librariesIncludes.push(lib)
                            }
                        })
                    } else {
                        if (!librariesIncludes.includes(_module.libs)) {
                            librariesIncludes.push(_module.libs)
                        }
                    }
                }

                librariesIncludes.forEach((lib) => {
                    const library = _libraries[lib]
                    if (library) {
                        const isFirstOrder = library.firstOrder
                        const isBuiltIn = library._builtIn
                        const read = readModule(lib, isBuiltIn)

                        if (typeof(read.init) == "function") {
                            read.init(_libraries)
                        }

                        loadLibrary[lib] = read.load ?? read
                    }
                })

                if (typeof (_module.init) !== "undefined") {
                    if (typeof (_module.init) !== "function") {
                        throw new Error(`Init not valid function`)
                    }
                    _module.init(loadLibrary)
                }

                _loaded.push(moduleName)
            } catch (error) {
                verbosity.error(`Failed at module initialization > [${moduleName}] >`, error.message)
                logDump(error)
            }
        })

    } catch (error) {
        verbosity.error(`Fatal error at initialization >`)
        console.log(error)
    }
}

init()
