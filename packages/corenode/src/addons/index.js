import fs from 'fs'
import path from 'path'

import { getRootPackage } from '../helpers'

let { verbosity, objectToArrayMap } = require('@corenode/utils')
verbosity = verbosity.options({ method: `[ADDONS]`, time: false })

const { EvalMachine } = require("../vm")

const defaults = {
    loader: `load.addon.js`,
    registryObjectName: `addons`,
    localAddonsPathname: `addons`
}

export default class AddonsController {
    constructor() {
        this.defaultLoader = defaults.loader // maybe on an future it could be interesting to include more support for custom loaders
        this.registryObjectName = defaults.registryObjectName
        this.localAddonsPathname = defaults.localAddonsPathname

        this.externalAddonsPath = path.resolve(process.cwd(), defaults.localAddonsPathname)
        this.internalAddonsPath = path.resolve(global._runtimeRoot, 'packages')

        this._addons = {}
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
        const addons = []

        if (fs.existsSync(origin)) {
            fs.readdirSync(origin).forEach((dir) => {
                const addonsPath = path.resolve(origin, dir)
                if (fs.existsSync(addonsPath)) {
                    addons.push(addonsPath)
                }
            })
        }

        return this.resolveLoader(addons)
    }

    fetchInternals = () => this.fetch(this.internalAddonsPath)

    fetchExternals = () => this.fetch(this.externalAddonsPath)

    fetchAddons() {
        const addons = {}
        const allAddons = []

        const internals = this.fetchInternals()
        const externals = this.fetchExternals()

        if (internals.length > 0) allAddons.push(...internals)
        if (externals.length > 0) allAddons.push(...externals)

        allAddons.forEach((loader) => {
            const _addon = this.readLoader(loader)
            const { pkg } = _addon

            addons[pkg] = {
                internal: internals.includes(loader),
                loader
            }
        })

        return addons
    }

    getRegistry(key) {
        const packageJSON = getRootPackage()
        const registry = packageJSON[defaults.registryObjectName] ?? {}

        if (key) {
            return registry[key]
        }

        return registry
    }

    getLoadedAddons() { return this._addons }

    getLoadedLibraries() { return this._libraries }

    getExternalAddonsPath() { return this.externalAddonsPath }

    loadAddon(loader) {
        let context = {}

        try {
            if (typeof (loader) === "string") {
                if (fs.existsSync(loader)) {
                    if (!loader.includes(`load.addon.js`)) {
                        loader = path.resolve(loader, `load.addon.js`)
                    }
                    const loaderFile = loader

                    loader = this.readLoader(loader)
                    loader.file = loaderFile
                }
            }
        } catch (error) {
            verbosity.dump(error)
            verbosity.error(`Failed to load external addon > [${loader}] >`, error.message)
            return false
        }

        loader.meta = {
            version: loader.version
        }
        loader.dirname = path.dirname(loader.file)

        if (typeof loader.pkg === "undefined") {
            throw new Error(`Invalid addon, missing [pkg]`)    
        }

        if (typeof loader.script !== "undefined") {
            try {
                const loaderScriptPath = path.resolve(loader.dirname, loader.script)
                if (!fs.existsSync(loaderScriptPath)) {
                    return verbosity.error(`[${loader.pkg}] Script file not exists: ` + loaderScriptPath)
                }

                const machine = new EvalMachine({
                    eval: loaderScriptPath,
                    cwd: loader.dirname,
                })

                context["script"] = machine
                process.runtime.appendToController(`${loader.pkg}`, (...context) => machine.run(...context))
            } catch (error) {
                verbosity.dump(error)
                verbosity.options({ method: `[VM]` }).error(`[${loader.pkg}] Failed at vm initalization >`, error)
            }
        }

        if (typeof loader.appendCli !== "undefined") {
            if (Array.isArray(loader.appendCli)) {
                loader.appendCli.forEach((entry) => {
                    if (typeof (global._cli.custom) == "undefined") {
                        global._cli.custom = []
                    }
                    global._cli.custom.push({ ...entry, exec: (...args) => entry.exec(context, ...args) })
                })
            }
        }

        if (typeof loader.init === "function") {
            try {
                // push libraries
                loader.init({})
            } catch (error) {
                verbosity.dump(error)
                verbosity.error(`Failed at addon initialization > [${loader.pkg}] >`, error.message)
            }
        }

        const manifest = {
            loader: loader.file,
            meta: loader.meta,
            internal: loader.internal ?? false,
        }

        this._addons[loader.pkg] = manifest
        return manifest
    }

    unloadAddon(key) {
        // emit event to runtime `beforeUnloadAddon`
        // emit event to runtime `afterUnloadAddon`

        // emit event to addon `onUnload`
        delete this.pool[key]
        delete this._addons[key]
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
        const allAddons = this.fetchAddons()
        const registry = this.getRegistry()

        objectToArrayMap(allAddons).forEach((manifest) => {
            if (typeof this._addons[manifest.key] === "undefined") {
                const { internal } = manifest.value

                if (internal || this.isOnRegistry(manifest.key)) {
                    const loader = this.readLoader(manifest.value.loader)
                    const _addon = this.loadAddon({ ...loader, internal: internal, file: manifest.value.loader })

                    if (!_addon) {
                        return false
                    }

                    const { meta } = _addon

                    if (!internal) {
                        const fromReg = this.getRegistry(manifest.key)
                        if (typeof (fromReg) !== "undefined" && typeof (meta.version) !== "undefined") {
                            if (meta.version !== fromReg) {
                                verbosity
                                    .options({ dumpFile: true })
                                    .warn(`Addon version conflict (${manifest.key}@${fromReg}) > Loaded (${manifest.key}@${meta.version})`)
                            }
                        } else {
                            verbosity.options({ dumpFile: "only" }).warn(`Version control is not available for addon (${manifest.key})`)
                        }
                    }
                }
            }
        })

        // read all registry
        objectToArrayMap(registry).forEach((entry) => {
            let loader = null

            const asPath = path.resolve(entry.value)
            if (fs.existsSync(asPath)) {
                loader = asPath
            }else {
                // import from cloud registry
            }
            
            // load addon
            this.loadAddon(loader)
        })
    }
}