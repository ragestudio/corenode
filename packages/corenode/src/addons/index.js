import fs from 'fs'
import path from 'path'

import { getRootPackage } from '../helpers'

let { verbosity, objectToArrayMap, readDirs } = require('@corenode/utils')
verbosity = verbosity.options({ method: `[ADDONS]`, time: false })

const { EvalMachine } = require("../vm")

const defaults = {
    loaderFilename: `load.addon.js`,
    addonsFlagName: `addons`,
}

function requireFromString(src, filename) {
    var Module = module.constructor
    var m = new Module()

    m._compile(src, filename)
    return m.exports
}

class Addon {
    constructor(params) {
        this.params = params ?? {}

        this.loader = {}
        this.machine = null

        // try to read loader file
        if (typeof this.params.loader === "string") {
            try {
                this.params.loader = path.resolve(this.params.loader)

                if (fs.existsSync(this.params.loader)) {
                    this.loader = fs.readFileSync(this.params.loader, 'utf-8')
                    this.loader = requireFromString(this.loader, '')
                    this.loader.file = this.params.loader
                }
            } catch (error) {
                process.runtime.logger.dump(error)
                verbosity.error(`Cannot read addon loader > ${error.message}`)
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

        return this
    }

    load() {
        if (typeof this.loader.script !== "undefined") {
            try {
                const loaderScriptPath = path.resolve(this.loader.dirname, this.loader.script)
                if (!fs.existsSync(loaderScriptPath)) {
                    return verbosity.error(`[${this.loader.pkg}] Script file not exists: ` + loaderScriptPath)
                }

                this.machine = new EvalMachine({
                    file: loaderScriptPath,
                    cwd: this.loader.dirname,
                })

                process.runtime.appendToController(`${this.loader.pkg}`, this.machine.dispatcher())
            } catch (error) {
                process.runtime.logger.dump(error)
                verbosity.options({ method: `[VM]` }).error(`[${this.loader.pkg}] Failed at vm initalization >`, error)
            }
        }

        if (typeof this.loader.appendCli !== "undefined") {
            if (Array.isArray(this.loader.appendCli)) {
                this.loader.appendCli.forEach((entry) => {
                    if (typeof global._cli.custom === "undefined") {
                        global._cli.custom = []
                    }
                    global._cli.custom.push({ ...entry, exec: (...args) => entry.exec(this, ...args) })
                })
            }
        }

        if (typeof this.loader.init === "function") {
            try {
                this.loader.init()
            } catch (error) {
                process.runtime.logger.dump(error)
                verbosity.error(`Failed at addon initialization > [${this.loader.pkg}] >`, error.message)
            }
        }

        return this.loader
    }

    unload() {

    }
}

export default class AddonsController {
    constructor() {
        this.loaders = {}
        this.addons = []

        this.defaultLoader = defaults.loaderFilename
        this.externalAddonsPath = path.resolve(process.cwd(), defaults.addonsFlagName)

        this.init()
    }

    loadAddon(loader) {
        const addon = new Addon({ loader })

        // check if the addon is not loaded
        if (typeof this.loaders[addon.loader.pkg] === "undefined") {
            addon.load()
            this.appendLoader(addon.loader)
        }
    }

    appendLoader = (addon) => {
        this.addons.push(addon.pkg)
        this.loaders[addon.pkg] = addon
    }

    isOnPackage = (key) => {
        return this.getAddonsFromPackage(key) ? true : false
    }

    fetchLoaders = (origin, maxDepth) => {
        const loaders = []

        if (fs.existsSync(origin)) {
            const dirs = readDirs(origin, maxDepth ?? 2)

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

    getLoadedAddons = () => this.addons

    init() {
        const allLoaders = this.fetchAllLoaders()

        allLoaders.forEach((loader) => {
            this.loadAddon(loader)
        })
    }
}