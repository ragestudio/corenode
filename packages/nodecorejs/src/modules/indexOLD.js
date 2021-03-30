import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import { getPackages, getInstalledNodecoreDependencies, getRootPackage } from '../helpers'

let { verbosity, objectToArrayMap, readRootDirectorySync } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: `[MODULES]`, time: false })

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

export function getLoadedModules() {
    return _modules
}

export function getModulesDependents() {
    const deps = getRootPackage().nmodules ?? {}
    return deps
}

// Read file where modules manifest is registered and returns it
export function readRegistry(params) {
    let registry = {}

    if (fs.existsSync(modulesRegistry)) {
        try {
            const read = fs.readFileSync(modulesRegistry, codecRegistry)
            if (read) {
                registry = JSON.parse(read)
            }

            if (params?.onlyNames ?? false) {
                return objectToArrayMap(registry).map((entry) => {
                    return entry.key
                })
            }
        } catch (error) {
            verbosity.options({ dumpFile: true }).error(`Failed to read registry >`, error.message)
        }
    }

    return registry
}

// scan & read all installed plugins and return an list
export function readInstalledPlugins() {
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
                verbosity.options({ dumpFile: true }).error(`Failed to load custom package module > [${pkg}] >`, error.message)
            }
        })
    }
    return registry
}

// scan & read module by name
// TODO: Load module file from manifest
export function readModule(moduleName, builtIn = false) {
    const _moduleDir = path.resolve((builtIn ? builtInLibraries : modulesPath), `${moduleName}`)
    const initializator = path.resolve(_moduleDir, `./index.js`)

    if (!fs.existsSync(initializator)) {
        throw new Error(`Module file is missing!`)
    }

    const _module = require(initializator)

    if (typeof (_module) !== "object") {
        throw new Error(`Invalid data type`)
    }

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

export function readModule_R(manifest) {
    const { pkg, _moduleFile, builtIn } = manifest

    if (!fs.existsSync(_moduleFile)) {
        throw new Error(`Module file is missing!`)
    }

    const _module = require(_moduleFile)

    if (typeof (_module) !== "object") {
        throw new Error(`Invalid data type`)
    }

    let { type, libs } = _module

    const firstOrder = !libs ? true : false // if module doesnt requires libraries is considered first level
    const isLib = type === "lib" ?? false

    return {
        ..._module,
        _lib: isLib ?? false,
        file: _moduleFile,
        firstOrder,
    }
}

export function loadRegistry(options) {
    try {
        let registry = readRegistry()
        verbosity.dump(`Loaded registry with > ${JSON.stringify(registry)}`)

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
        verbosity.options({ dumpFile: true }).error(`Failed at registry initialization >`, error.message)
    }
}

export function overwriteRegistry(registry) {
    if (typeof (registry) !== "object") {
        return false
    }

    if (!fs.existsSync(modulesRegistry)) {
        fs.mkdirSync(modulesPath, { recursive: true })
    }

    fs.writeFileSync(modulesRegistry, JSON.stringify(registry, null, 2), {
        encoding: codecRegistry,
        recursive: true
    })
    return true
}

export function allocateModule(pkg, _path) {
    const moduleDir = `${modulesPath}/${pkg}`

    if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true })
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
            resolve(moduleDir)
            return moduleDir
        } catch (error) {
            verbosity.dump(error)
            return reject(error)
        }
    })
}

export function linkModule(_module) {
    try {
        let registry = readRegistry()
        const { _lib, dir, firstOrder } = _module

        registry[_module.pkg] = {
            _lib, dir, firstOrder
        }

        overwriteRegistry(registry)
        return registry
    } catch (error) {
        verbosity.options({ dumpFile: true }).error(`Failed at writting registry >`, error.message)
    }
}

export function unlinkModule(name, options) {
    try {
        let registry = readRegistry()

        if (Boolean(options?.purge) && fs.existsSync(registry[name].dir)) {
            rimraf.sync(registry[name].dir)
        }

        delete registry[name]
    } catch (error) {
        verbosity.dump(error)
        throw new Error(error)
    }
    if (Boolean(options?.write)) {
        overwriteRegistry(registry)
    }
    return registry
}

// Itterate all modules and force to link to registry
export function linkModules() {
    listModulesNames().forEach((moduleName) => {
        try {
            linkModule(readModule(moduleName))
        } catch (error) {
            verbosity.options({ dumpFile: true }).error(`Failed at linking module > [${moduleName}] >`, error.message)
        }
    })
}

export function initModules(params) {
    try {
        loadRegistry({ write: (params?.write ?? false) })

        const autoLoadPlugins = readInstalledPlugins()
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
                verbosity.options({ dumpFile: true }).error(`Failed at module initialization > [${moduleName}] >`, error.message)
            }
        })

    } catch (error) {
        verbosity.options({ dumpFile: true }).error(`Fatal error at initialization > `, error.message)
    }
}