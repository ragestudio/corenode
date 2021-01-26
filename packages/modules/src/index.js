import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import logDump from '@nodecorejs/log'
import { isDependencyInstalled, addDependency, getPackages, getInstalledNodecoreDependencies } from '@nodecorejs/dot-runtime'

let { verbosity, objectToArrayMap, readRootDirectorySync } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: `nodecore_modules`, time: false })

let _modules = {}
let _libraries = {}
let _loaded = []

const codecRegistry = 'utf-8'

if (!global.nodecore_modules) {
    global.nodecore_modules = {}
}

const modulesPath = global.nodecore_modules.modulesPath = path.resolve(process.cwd(), 'nodecore_modules')
const modulesRegistry = global.nodecore_modules.modulesRegistry = path.resolve(modulesPath, `.modules.json`)
const builtInLibraries = global.nodecore_modules.builtInLibraries = path.resolve(__dirname, "libraries")

export function listExternalPluginsNames() {
    return getInstalledNodecoreDependencies()
}

export function listModulesNames() {
    return readRootDirectorySync(modulesPath)
}

export function readRegistry(params) {
    let registry = {}
    try {
        if (fs.existsSync(modulesRegistry)) {
            const read = fs.readFileSync(modulesRegistry, codecRegistry)
            if (read) {
                registry = JSON.parse(read)
            }
        }
        if (params?.onlyNames ?? false) {
            return objectToArrayMap(registry).map((entry) => {
                return entry.key
            })
        }
    } catch (error) {
        verbosity.error(`Failed to read registry >`, error.message)
    }

    return registry
}

export function readAutoLoadPlugins() {
    let registry = {}

    const fromProyectPackages = getPackages({ fullPath: true })
    const fromNodeModules = listExternalPluginsNames()

    const paths = [...fromNodeModules, ...fromProyectPackages]

    if (Array.isArray(paths)) {
        const moduleLoadFile = "load.module.js"

        paths.forEach((pkg) => {
            try {
                const _moduleFilePath = path.resolve(pkg, moduleLoadFile)
                if (fs.existsSync(_moduleFilePath)) {
                    const _module = require(_moduleFilePath)
                    if (_module.pkg != null) {
                        return registry[_module.pkg] = {
                            ..._module,
                            dir: _moduleFilePath,
                            _autoLoaded: true
                        }
                    }
                    return false
                }
            } catch (error) {
                verbosity.error(`Failed to load custom package module > [${pkg}] >`, error.message)
            }
        })
    }
    return registry
}

export function readModule(moduleName, builtIn = false) {
    const _moduleDir = path.resolve((builtIn ? builtInLibraries : modulesPath), `${moduleName}`)
    const initializator = path.resolve(_moduleDir, `./index.js`)

    if (!fs.existsSync(initializator)) {
        throw new Error(`Initializator not found!`)
    }
    const _module = require(initializator)

    let { type, libs } = _module
    const firstOrder = !libs ? true : false // if module doesnt requires libraries is considered first level
    const isLib = type === "lib" ?? false

    return {
        ..._module,
        _lib: isLib ?? false,
        dir: _moduleDir,
        firstOrder,
    }
}

export function loadRegistry(forceWriteLink) {
    try {
        let registry = readRegistry()
        
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

        objectToArrayMap(registry).forEach((entry) => {
            const isLib = entry.value._lib

            if (isLib) {
                _libraries[entry.key] = entry.value
            } else {
                _modules[entry.key] = entry.value
            }
        })
    } catch (error) {
        verbosity.error(`Failed at registry initialization >`, error.message)
        logDump(error)
    }
}

export function overwriteRegistry(registry) {
    if (typeof (registry) !== "object") {
        return false
    }
    fs.writeFileSync(modulesRegistry, JSON.stringify(registry, null, 2), {
        encoding: codecRegistry,
        recursive: true
    })
    return true
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
            resolve(moduleDir)
            return moduleDir
        } catch (error) {
            const errStr = `Failed at writting module >`

            logDump(errStr, error)
            return reject(error)
        }
    })
}

export function linkModule(_module, write = false) {
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
        if (write) {
            overwriteRegistry(registry)
        }
        return registry
    } catch (error) {
        verbosity.error(`Failed at writting registry >`, error.message)
        logDump(error)
    }
}

export function unlinkModule(name, write = false, purge = false) {
    let registry = readRegistry()
    try {
        if (purge && fs.existsSync(registry[name].dir)) {
            rimraf.sync(registry[name].dir)
        }
        delete registry[name]
    } catch (error) {
        // who cares
    }
    if (write) {
        overwriteRegistry(registry)
    }
    return registry
}

export function linkAllModules(force = false) {
    let registry = readRegistry()

    listModulesNames().forEach((moduleName) => {
        try {
            if (!registry[moduleName] || force) {
                linkModule(readModule(moduleName), true)
            }
        } catch (error) {
            verbosity.error(`Failed at linking module > [${moduleName}] >`, error.message)
            logDump(error)
        }
    })
}

// initialize Modules & Libraries
export function initModules(params) {
    try {
        loadRegistry(params?.force ?? false)

        const autoLoadPlugins = readAutoLoadPlugins()
        if (autoLoadPlugins) {
            _modules = { ..._modules, ...autoLoadPlugins }
        }
        
        objectToArrayMap(_modules).forEach((entry) => {
            const moduleName = entry.key
            const moduleRegistry = entry.value

            if (_loaded.includes(moduleName)) return // Avoid load multi time per runtime

            try {
                let loadLibrary = {}

                const _module = moduleRegistry?._autoLoaded ? moduleRegistry : readModule(moduleName)
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
                        //const isFirstOrder = library.firstOrder
                        const isBuiltIn = library._builtIn
                        const read = readModule(lib, isBuiltIn)

                        if (typeof (read.init) == "function") {
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

initModules()
