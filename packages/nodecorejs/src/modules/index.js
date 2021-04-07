import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import { getPackages, getInstalledNodecoreDependencies, getRootPackage } from '../helpers'

let { verbosity, objectToArrayMap, readRootDirectorySync } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: `[MODULES]`, time: false })

const defaults = {
    loader: `load.module.js`,
    registryObjectName: `modules`,
    localModulesPathname: `modules`
}

export default class modules {
    constructor() {
        if (typeof (global.nodecore) === "undefined") {
            throw new Error(`Nodecore runtime has not been initialized`)
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

    readLoader(loader) {
        const _module = require(loader)
        return _module
    }

    resolveLoadModule(origin) {
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

        return this.resolveLoadModule(modules)
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
        let registry = []

        const packageJSON = getRootPackage()
        const externalModules = packageJSON[defaults.registryObjectName] ?? {}

        objectToArrayMap(externalModules).forEach((_module) => {
            registry.push(_module)
        })

        if (key && externalModules[key]) {
            return externalModules[key]
        }

        return registry
    }

    getLoadedModules = () => { return this._modules }

    getLoadedLibraries = () => { return this._libraries }

    getExternalModulesPath = () => { return this.externalModulesPath }

    loadModule(manifest) {
        const { loader, internal } = manifest

        if (fs.existsSync(loader)) {
            const _module = require(loader)

            this._modules[_module.pkg] = manifest
            manifest.meta = {
                version: _module.version
            }

            if (typeof (_module.init) === "function") {
                try {
                    _module.init(this._libraries)
                } catch (error) {
                    verbosity.dump(error)
                    verbosity.error(`Failed at module initialization > [${_module.pkg}] >`, error.message)
                }
            }
        }

        return manifest
    }

    unloadModule(key) {

    }

    writeRegistry() {
        const packageJSONPath = path.resolve(process.cwd(), 'package.json')
        let packageJSON = getRootPackage()

        if (typeof (packageJSON) !== "object") {
            throw new Error(`Invalid typeof >> package.json is not an object`)
        }

        if (typeof (packageJSON[this.registryObjectName]) === "undefined") {
            packageJSON[this.registryObjectName] = {

            }
        }

        packageJSON[this.registryObjectName] = this.getRegistry()
        fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2), { encoding: "utf8" })
    }

    allocateModules() {
        // writeRegistry

        // fs create dir and write file with sources (Installation proccess)
    }

    isOnRegistry(key) {
        let is = false

        const registry = this.getRegistry()
        registry.forEach((entry) => {
            if (entry.key === key) {
                is = true
            }
        })

        return is
    }

    init() {
        const allModules = this.fetchModules()

        this._libraries["builtIn"] = require("@nodecorejs/builtin-lib") // force to push builtIn lib

        objectToArrayMap(allModules).forEach((manifest) => {
            if (typeof (this._modules[manifest.key]) === "undefined") {
                const { internal } = manifest.value

                if (internal || this.isOnRegistry(manifest.key)) {
                    const _module = this.loadModule(manifest.value)
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
    }
}