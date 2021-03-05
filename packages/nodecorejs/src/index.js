/**
 * NodecoreJS
 * @module @ragestudio/nodecorejs 
 */
import path from 'path'
import process from 'process'
import fs from 'fs'

const runtimeEnviromentFiles = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
const versionOrderScheme = global.versionScheme = { mayor: 0, minor: 1, patch: 2 }
const versionsTypes = Object.keys(versionOrderScheme)

console.log(global)

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

Object.freeze(global._packages.set)
Object.freeze(global._packages.del)


const setPackage = global._packages.set

setPackage("__engine", path.resolve(__dirname, '../../package.json'))
setPackage("__proyect", path.resolve(process.cwd(), 'package.json'))


import * as helpers from './helpers'
import { Aliaser } from '@nodecorejs/builtin-lib'

new Aliaser({ "@@nodecore": __dirname })

let { objectToArrayMap, verbosity } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })


runtimeEnviromentFiles.forEach(runtime => {
    if (!global._env) {
        const fromPath = path.resolve(process.cwd(), `./${runtime}`)
        if (fs.existsSync(fromPath)) {
            global._envpath = fromPath
            try {
                global._env = JSON.parse(fs.readFileSync(fromPath))
            } catch (error) {
                verbosity.error(error)
            }
        }
    }
})

if (global._env["version"]) {
    try {
        const parsedVersion = helpers.getVersion()
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

export * from './modules'
export * from './helpers'