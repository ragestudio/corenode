/**
 * NodecoreJS
 * @module @ragestudio/nodecorejs 
 */
import path from 'path'
import process from 'process'
import fs from 'fs'

import * as modules from './modules'
import * as helpers from './helpers'
import { aliaser, globals } from '@nodecorejs/builtin-lib'

let { objectToArrayMap, verbosity } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })

class Runtime {
    constructor(load, context, options) {
        this.init().then(() => {
            modules.initModules()

            if (typeof (load) !== "undefined") {
                require(load)
            }
        })
    }

    initAliaser() {
        new aliaser({ "@@nodecore": __dirname })

        // TODO: Autoload .setalias
    }

    initGlobals() {
        new globals(["nodecore_cli", "nodecore", "nodecore_modules"])

        global._version = {}
        global._packages = {}
        global._env = null
        global._envpath = path.resolve(process.cwd(), '.nodecore')
        global._runtimeSource = path.resolve(__dirname, "..")

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

        _setPackage("__engine", path.resolve(__dirname, '../../package.json'))
        _setPackage("__proyect", path.resolve(process.cwd(), 'package.json'))
    }

    setRuntimeEnv() {
        const runtimeEnviromentFiles = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
        runtimeEnviromentFiles.forEach(file => {
            if (!global._env) {
                const fromPath = path.resolve(process.cwd(), `./${file}`)
                if (fs.existsSync(fromPath)) {
                    global._envpath = fromPath
                    try {
                        global._env = JSON.parse(fs.readFileSync(fromPath, 'utf-8'))
                    } catch (error) {
                        console.error(`\n❌🆘  Error parsing runtime env > ${error.message} \n\n`)
                        console.error(error)
                    }
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
                this.initAliaser()
                this.initGlobals()
                this.setGlobals()
                this.setRuntimeEnv()
                this.setVersions()

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
    modules
}