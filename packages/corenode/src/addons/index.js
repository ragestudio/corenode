const fs = require("fs")
const path = require("path")
const { performance } = require('perf_hooks')
const { objectToArrayMap, readDirs, moduleFromString } = require('@corenode/utils')

const pkgManager = require("../packageManager")
const { getRootPackage } = require('../helpers')
const { EvalMachine } = require('../vm')

const log = process.runtime.logger
const defaults = {
    loaderFilename: `load.addon.js`,
    addonsFlagName: `addons`,
}

class Addon {
    constructor(params) {
        this.params = params ?? {}

        this.loader = {}
        
        // try to read loader file
        if (typeof this.params.loader === "string") {
            try {
                if (fs.existsSync(this.params.loader)) {
                    this.loader = fs.readFileSync(this.params.loader, 'utf-8')
                    this.loader = moduleFromString(this.loader, '')
                    this.loader.file = this.params.loader
                }
            } catch (error) {
                log.dump("error", error)
                log.error(`Cannot read addon loader > ${error.message}`)
            }
        } else {
            this.loader = this.params.loader
        }

        // process loader
        if (typeof this.loader.pkg === "undefined") {
            throw new Error(`Invalid addon, missing [pkg]`)
        }

        if (typeof this.loader.file !== "undefined") {
            this.loader.dirname = path.dirname(this.loader.file)
        }

        this.pkg = this.loader.pkg
        this.dirname = this.loader.dirname
        this.machine = null

        //* before init
        if (typeof this.loader.init === "function") {
            try {
                this.loader.init()
            } catch (error) {
                log.dump("error", error)
                log.error(`Failed at addon initialization > [${this.loader.pkg}] >`, error.message)
            }
        }

        return this
    }

    checkDependencies = async () => {
        if (process.runtime.disableCheckDependencies) {
            return true
        }

        if (this.loader.hasDependencies && typeof this.loader.dirname !== "undefined") {
            const addonPackageJson = path.resolve(this.loader.dirname, 'package.json')
            if (fs.existsSync(addonPackageJson)) {
                this.loader.dependencies = require(addonPackageJson).dependencies ?? {}
            }
        }
        
        const dependenciesTypes = ["dependencies", "devDependencies"]
        dependenciesTypes.forEach((type) => {
            if (typeof this.loader[type] === "object") {
                objectToArrayMap(this.loader[type]).forEach((dependency) => {
                    const { key, value } = dependency
                    const depValid = pkgManager.check(key)

                    //* try to install before initialization
                    if (!depValid && !this.loader.ignoreDependencies) {
                        const dep = `${key}@${value}`

                        console.warn(`⚠️  Missing dependency, trying to install...[${dep}]`)
                        pkgManager.install(dep, { cwd: this.loader.dirname })
                    }
                })
            }
        })
    }

    load = () => {
        const loadStart = performance.now()

        if (typeof this.loader.script !== "undefined") {
            try {
                const loaderScriptPath = path.resolve(this.loader.dirname, this.loader.script)
                if (!fs.existsSync(loaderScriptPath)) {
                    return log.error(`[${this.loader.pkg}] Script file not exists: ${loaderScriptPath}`)
                }

                this.machine = new EvalMachine({
                    file: loaderScriptPath,
                    cwd: this.loader.dirname,
                })
                
                process.runtime.appendToController(`${this.loader.pkg}`, this.machine.dispatcher())
            } catch (error) {
                log.dump("error", error)
                log.error(`[${this.loader.pkg}] Failed at vm initialization >`, error)
            }
        }

        if (typeof this.loader.appendCli !== "undefined") {
            process.runtime.appendToCli(this.loader.appendCli)
        }

        const loaderEnd = performance.now()
        this.loader.timings = {
            load: loaderEnd - loadStart
        }

        return this.loader
    }

    unload = () => {
        process.runtime.addonsController.unload(this.loader.pkg)
    }
}

class addonsController {
    constructor() {
        this.disabledController = process.runtime.disabledAddons
        this.disabledAddons = [...(global._env?.disabledAddons ?? [])]
        this.ignoreAddons = [...(global._env?.ignoreAddons ?? [])]

        this.loaders = {}
        this.addons = {}
        this.query = []

        this.defaultLoader = defaults.loaderFilename
        this.externalAddonsPath = path.resolve(process.cwd(), defaults.addonsFlagName)

        this.allLoaders = this.fetchAllLoaders()

        if (!this.disabledController) {
            this.allLoaders.forEach((loader) => {
                this.queryLoader(loader)
            })
        }
    }

    unload = (key) => {
        if (typeof this.addons[key] === 'undefined') {
            return false
        }
        this.addons[key].machine.destroy()
        delete this.addons[key]
        delete this.loaders[key]
    }

    queryLoader(loader) {
        let allowed = true
        const addon = new Addon({ loader })

        if (Array.isArray(this.ignoreAddons)) {
            if (this.ignoreAddons.includes(addon.pkg)) {
                allowed = false
            }
        }

        if (allowed) {
            this.query.push(addon)
        }
    }

    checkDependencies = async () => {
        if (Array.isArray(this.query)) {
            for await (const addon of this.query) {
                await addon.checkDependencies()
            }
        }
    }

    loadAddon(addon) {
        if (addon instanceof Addon) {
            // check if the addon is not loaded
            if (typeof this.addons[addon.loader.pkg] === "undefined") {
                addon.disabled = this.disabledAddons.includes(addon.loader.pkg)
                addon.loader.disabled = addon.disabled

                this.appendLoader(addon.loader)
                this.addons[addon.loader.pkg] = addon
                if (!addon.disabled) {
                    addon.load()
                }
            }
        } else {
            throw new Error(`Invalid class of addon!`)
        }
    }

    appendLoader = (addon) => {
        this.loaders[addon.pkg] = addon
    }

    fetchLoaders = (origin, maxDepth) => {
        const loaders = []

        if (fs.existsSync(origin)) {
            const dirs = readDirs(origin, maxDepth ?? (global._env.maxFetchLoadersDepth ?? 3))

            dirs.forEach((dir) => {
                const loader = path.resolve(dir, defaults.loaderFilename)
                if (fs.existsSync(loader)) {
                    loaders.push(loader)
                }
            })
        }

        return loaders
    }

    fetchAllLoaders() {
        const allLoaders = []

        objectToArrayMap(this.packageAddons.get()).forEach((addon) => {
            allLoaders.push(addon.value)
        })

        this.fetchLoaders(this.externalAddonsPath).forEach((addon) => {
            allLoaders.push(addon)
        })

        this.fetchLoaders(path.resolve(process.cwd(), `node_modules`)).forEach((addon) => {
            allLoaders.push(addon)
        })

        return allLoaders
    }

    packageAddons = {
        get: (key) => {
            const packageJSON = getRootPackage()
            const registry = packageJSON[defaults.addonsFlagName] ?? {}

            if (key) {
                return registry[key]
            }

            return registry
        },
        add: (key, value) => {
            let registry = this.packageAddons.get()
            registry[key] = value ?? '0.0.0'

            this.packageAddons.writePackage(registry)
        },
        remove: (key) => {
            let registry = this.packageAddons.get()
            registry = delete registry[key]

            this.packageAddons.writePackage(registry)
        },
        write: (update) => {
            if (!update) return false

            const packageJSONPath = path.resolve(process.cwd(), 'package.json')
            let packageJSON = getRootPackage()

            if (typeof (packageJSON) !== "object") {
                throw new Error(`Invalid typeof >> package.json is not an object`)
            }

            packageJSON[defaults.addonsFlagName] = update
            fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2), { encoding: "utf8" })
        }
    }

    getLoadedAddons = () => Object.keys(this.addons)

    async init() {
        if (!this.disabledController) {
            for await (const [index, addon] of this.query.entries()) {
                this.query = this.query.slice(index, (this.query.length - 1))
                await this.loadAddon(addon)
            }
        }

        process.runtime.events.emit('init_addons_done')
    }
}

module.exports = {
    addonsController,
    Addon
}