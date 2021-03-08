/**
 * NodecoreJS
 * @module @ragestudio/nodecorejs 
 */
import path from 'path'
import process from 'process'
import fs from 'fs'

import * as modules from './modules'
import * as helpers from './helpers'
import { Aliaser, Globals } from '@nodecorejs/builtin-lib'

class Runtime {
    constructor(params) {
        console.log(params)
        this.init().then(() => {
            modules.initModules()
        })
    }

    init() {
        return new Promise((resolve, reject) => {
            new Aliaser({ "@@nodecore": __dirname })
            new Globals(["nodecore_cli", "nodecore", "nodecore_modules"])

            const runtimeEnviromentFiles = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
            const versionOrderScheme = global.versionScheme = { mayor: 0, minor: 1, patch: 2 }
            const versionsTypes = Object.keys(versionOrderScheme)

            global._version = {}
            global._env = null
            global._envpath = path.resolve(process.cwd(), '.nodecore')
            global._packages = {
                set: (key, path) => {
                    global._packages[key] = path
                },
                del: (key) => {
                    delete global._packages[key]
                }
            }

            global._packages.set = Object.seal(global._packages.set)
            global._packages.del = Object.seal(global._packages.del)

            const setPackage = global._packages.set

            setPackage("__engine", path.resolve(__dirname, '../../package.json'))
            setPackage("__proyect", path.resolve(process.cwd(), 'package.json'))

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

            const { getVersion } = require('./helpers')
            let { objectToArrayMap, verbosity } = require('@nodecorejs/utils')
            verbosity = verbosity.options({ method: "[RUNTIME]" })

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
            resolve()
        })
    }
}

new Runtime()

module.exports = {
    ...helpers,
    modules
}