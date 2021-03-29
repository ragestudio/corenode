import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import { getPackages, getInstalledNodecoreDependencies, getRootPackage } from '../helpers'

let { verbosity, objectToArrayMap, readRootDirectorySync } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: `[MODULES]`, time: false })


export default class modules {
    constructor() {
        if (typeof (global.nodecore) === "undefined") {
            throw new Error(`Nodecore runtime has not been initialized`)
        }
        this.registryObjectName = `modules`

        this.externalModulesPath = path.resolve(process.cwd(), 'modules')
        this.internalModulesPath = path.resolve(global._runtimeSource, 'node_modules')

        this._modules = global.nodecore._modules = {}
        this._libraries = global.nodecore._libraries = {}
    }

    getLoadedModules() {
        return this._modules     
    }

    // Temporarily disabled to avoid unwanted external execution
    getLoadedLibraries() {
        return {}
    }

    // Fetch internal modules included on nodecore source
    fetchInternals() {
        const dirs = fs.readdirSync(this.internalModulesPath)
        console.log(dirs)
    }

    fetchModules() {
        // only works with external plugins & modules
        // read persistent storaged modules source files and create an array map >> [{ pkg: "NAME/ID", path: "DIR" }]
        const allModules = this.fetchModules() 


        fs.readdirSync(this.externalModulesPath)
    }

    getRegistry() {
        const packageJSON = getRootPackage()

        const externalModules = packageJSON[this.registryObjectName] ?? {}
        const internalModules = this.fetchInternals()



        return modulesRegistry
    }

    loadModules() {
        // getRegistry
        // fetchModules, check if mutation and apply
        // initialize itterating modules

        // return >> modules map
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
}