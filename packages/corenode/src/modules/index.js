import fs from 'fs'
import path from 'path'

import { getRootPackage } from '../helpers'

let { verbosity, objectToArrayMap, safeStringify } = require('@corenode/utils')
verbosity = verbosity.options({ method: `[MODULES]`, time: false })

const BuiltInLib = require("@corenode/builtin-lib")
const RequireController = require("../require")
const { EvalMachine } = require("../vm")

const defaults = {
    loader: `load.module.js`,
    registryObjectName: `modules`,
    localModulesPathname: `modules`
}

export default class ModuleController {
    constructor() {
        if (typeof (global.corenode) === "undefined") {
            throw new Error(`corenode runtime has not been initialized`)
        }

        this.defaultLoader = defaults.loader // maybe on an future it could be interesting to include more support for custom loaders
        this.registryObjectName = defaults.registryObjectName
        this.localModulesPathname = defaults.localModulesPathname

        this.externalModulesPath = path.resolve(process.cwd(), defaults.localModulesPathname)
        this.internalModulesPath = path.resolve(global._runtimeRoot, 'packages')

        this._modules = {}
        this._libraries = {}

        this.init()
    }

    isOnRegistry(key) { return this.getRegistry(key) ? true : false }

    readLoader(loader) {
        return require(loader)
    }

    resolveLoader(origin) {
        let loaders = []
        let dirs = []

        if (typeof (origin) === "string") {
            dirs.push(origin)
        }
        if (Array.isArray(origin)) {
            dirs = origin
        }

        dirs.forEach((dir) => {
            const loader = `${dir}/${this.defaultLoader}`
            if (fs.existsSync(loader)) {
                loaders.push(loader)
            }
        })

        return loaders
    }

    fetch(origin) {
        const modules = []

        if (fs.existsSync(origin)) {
            fs.readdirSync(origin).forEach((dir) => {
                const modulesPath = path.resolve(origin, dir)
                if (fs.existsSync(modulesPath)) {
                    modules.push(modulesPath)
                }
            })
        }

        return this.resolveLoader(modules)
    }

    fetchInternals = () => this.fetch(this.internalModulesPath)

    fetchExternals = () => this.fetch(this.externalModulesPath)

    fetchModules() {
        const modules = {}
        const allModules = []

        const internals = this.fetchInternals()
        const externals = this.fetchExternals()

        if (internals.length > 0) allModules.push(...internals)
        if (externals.length > 0) allModules.push(...externals)

        allModules.forEach((loader) => {
            const _module = this.readLoader(loader)
            const { pkg } = _module

            modules[pkg] = {
                internal: internals.includes(loader),
                loader
            }
        })

        return modules
    }

    getRegistry(key) {
        const packageJSON = getRootPackage()
        const registry = packageJSON[defaults.registryObjectName] ?? {}

        if (key) {
            return registry[key]
        }

        return registry
    }

    getLoadedModules() { return this._modules }

    getLoadedLibraries() { return this._libraries }

    getExternalModulesPath() { return this.externalModulesPath }

    async loadModule(loader) {
        try {
            if (typeof (loader) === "string") {
                if (fs.existsSync(loader)) {
                    const loaderFile = loader

                    loader = this.readLoader(loader)
                    loader.file = loaderFile
                }
            }
        } catch (error) {
            verbosity.dump(error)
            verbosity.error(`Failed to load external module > [${loader}] >`, error.message)
            return false
        }

        loader.meta = {
            version: loader.version
        }

        if (loader.script) {
            try {
                const loaderScriptPath = path.resolve(loader.script)
                if (!fs.existsSync(loaderScriptPath)) {
                    return verbosity.error(`[${loader.pkg}] Script file not exists: ` + loaderScriptPath)
                }

                new EvalMachine({
                    eval: loaderScriptPath
                })
            } catch (error) {
                console.error(error)
                verbosity.error(`[${loader.pkg}] Failed at run script >`, error.message)
            }
        }

        if (typeof (loader.init) === "function") {
            try {
                loader.init(BuiltInLib)
            } catch (error) {
                verbosity.dump(error)
                verbosity.error(`Failed at module initialization > [${loader.pkg}] >`, error.message)
            }
        }

        const manifest = {
            loader: loader.file,
            meta: loader.meta,
            internal: loader.internal ?? false,
        }

        this._modules[loader.pkg] = manifest
        return manifest
    }

    unloadModule(key) {

    }

    registryKey = {
        add: (key, value) => {
            let registry = this.getRegistry()
            registry[key] = value ?? '0.0.0'

            this.writeRegistry(registry)
        },
        remove: (key) => {
            let registry = this.getRegistry()
            registry = delete registry[key]

            this.writeRegistry(registry)
        }
    }

    writeRegistry(registry) {
        if (!registry) return false
        const packageJSONPath = path.resolve(process.cwd(), 'package.json')
        let packageJSON = getRootPackage()

        if (typeof (packageJSON) !== "object") {
            throw new Error(`Invalid typeof >> package.json is not an object`)
        }

        packageJSON[this.registryObjectName] = registry
        fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2), { encoding: "utf8" })
    }

    init() {
        const allModules = this.fetchModules()
        const registry = this.getRegistry()

        this._libraries["builtIn"] = require("@corenode/builtin-lib") // force to push builtIn lib

        objectToArrayMap(allModules).forEach((manifest) => {
            if (typeof (this._modules[manifest.key]) === "undefined") {
                const { internal } = manifest.value

                if (internal || this.isOnRegistry(manifest.key)) {
                    const loader = this.readLoader(manifest.value.loader)
                    const _module = this.loadModule({ ...loader, internal: internal, file: manifest.value.loader })

                    if (!_module) {
                        return
                    }

                    const { meta } = _module

                    if (!internal) {
                        const fromReg = this.getRegistry(manifest.key)
                        if (typeof (fromReg) !== "undefined" && typeof (meta.version) !== "undefined") {
                            if (meta.version !== fromReg) {
                                verbosity
                                    .options({ dumpFile: true })
                                    .warn(`Module version conflict (${manifest.key}@${fromReg}) > Loaded (${manifest.key}@${meta.version})`)
                            }
                        } else {
                            verbosity.options({ dumpFile: "only" }).warn(`Version control is not available for module (${manifest.key})`)
                        }
                    }

                }

            }
        })

        // read all registry
        objectToArrayMap(registry).forEach((entry) => {
            // try to load as an loader
            if (fs.existsSync(entry.value)) {
                this.loadModule(entry.value)
            } else {

            }
        })
    }
}