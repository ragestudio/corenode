/**
 * corenode
 * @module corenode 
 */
import path from 'path'
import process from 'process'
import fs from 'fs'

import modulesController from './modules'
import * as helpers from './helpers'
import { aliaser, globals } from '@corenode/builtin-lib'

let { objectToArrayMap, verbosity } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })

// const getRuntimeDeep = () => Object.keys(process.runtime).length

class Runtime {
    constructor(load, context, options) {
        global._inited = false

        this.thread = 0 // By default
        this.modules = null
        this.helpers = helpers

        if (typeof (process.runtime) !== "object") {
            process.runtime = {}
        }

        this.init().then(() => {
            // try to allocate thread
            while (typeof (process.runtime[this.thread]) !== "undefined") {
                this.thread += 1
            }
            if (typeof (process.runtime[this.thread]) === "undefined") {
                process.runtime[this.thread] = this
            }
            
            // create new moduleController
            this.modules = new modulesController()
            
            // flag runtime as inited
            global._inited = true

            // watch for load script
            if (typeof (load) !== "undefined") {
                try {
                    if (!fs.existsSync(load)) {
                        throw new Error(`Cannot read loader script [${load}]`)
                    } 
                    require(load)
                } catch (error) {
                    verbosity.dump(error)
                    verbosity.error(`Runtime loader catch error > ${error.message}`)
                }
        
            }
        })
    }

    initAliaser() {
        new aliaser({ "@@corenode": __dirname })

        // TODO: Autoload .setalias
    }

    initGlobals() {
        // Create empty globals
        new globals(["corenode_cli", "corenode"])

        const keywords = ["_version", "_packages", "_env", "_envpath", "_runtimeSource", "_runtimeRoot"]

        keywords.forEach((key) => {
            if (typeof (global[key]) === "undefined") {
                global[key] = {}
            }
        })

        global._envpath = path.resolve(process.cwd(), '.corenode')
        global._runtimeSource = path.resolve(__dirname, "..")
        global._runtimeRoot = path.resolve(__dirname, '../../..') // TODO: fix with process.env

        // TODO: Solve freeze function object
        global._setPackage = Object.freeze((key, path) => {
            global._packages[key] = path
        })
        global._delPackage = Object.freeze((key) => {
            delete global._packages[key]
        })
    }

    setGlobals() {
        const { _setPackage } = global

        _setPackage("_engine", path.resolve(__dirname, '../../package.json'))
        _setPackage("_project", path.resolve(process.cwd(), 'package.json'))
    }

    setRuntimeEnv() {
        const runtimeEnviromentFiles = ['.corenode', '.corenode.js', '.corenode.ts', '.corenode.json']

        runtimeEnviromentFiles.forEach(file => {
            const fromPath = path.resolve(process.cwd(), `./${file}`)
            if (fs.existsSync(fromPath)) {
                global._envpath = fromPath
                try {
                    global._env = JSON.parse(fs.readFileSync(fromPath, 'utf-8'))
                } catch (error) {
                    console.error(`\n🆘  Error parsing runtime env > ${error.message} \n\n`)
                    console.error(error)
                }
            }
        })
    }

    setVersions() {
        const { getVersion } = require('./helpers')

        const versionOrderScheme = global.versionScheme = { mayor: 0, minor: 1, patch: 2 }
        const versionsTypes = Object.keys(versionOrderScheme)

        if (global._env?.version) {
            try {
                const parsedVersion = getVersion()
                if (typeof (parsedVersion) !== "string") {
                    throw new Error(`Invalid version data type, recived > ${typeof (parsedVersion)}`)
                }

                versionsTypes.forEach((type) => {
                    global._version[type] = null
                })

                objectToArrayMap(parsedVersion.split('.')).forEach((entry) => {
                    let entryValue = null

                    if (isNaN(Number(entry.value))) {
                        entryValue = entry.value
                    } else {
                        entryValue = Number(entry.value)
                    }

                    if (entryValue != null) {
                        global._version[versionsTypes[entry.key]] = entryValue
                    }
                })
            } catch (error) {
                verbosity.error("🆘 Failed to load current version >", error.message)
            }
        }
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                if (!global._inited) {
                    this.initAliaser()
                    this.initGlobals()
                    this.setGlobals()
                    this.setRuntimeEnv()
                    this.setVersions()
                }

                return resolve()
            } catch (error) {
                return reject(error)
            }
        })
    }
}

module.exports = {
    Runtime,
    ...helpers,
}