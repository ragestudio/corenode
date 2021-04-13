/**
 * corenode
 * @module corenode 
 */
import path from 'path'
import process from 'process'
import fs from 'fs'
import vm from 'vm'

let { verbosity, schemizedParse } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[RUNTIME]" })

const environmentFiles = ['.corenode', '.corenode.js', '.corenode.ts', '.corenode.json']

class Runtime {
    constructor(load, context, options) {
        if (typeof (global._inited) === "undefined") {
            global._inited = false
        }

        if (typeof (process.runtime) !== "object") {
            process.runtime = {}
        }

        this.helpers = require("./helpers")
        this.thread = 0 // By default
        this.modules = null

        this.init().then(() => {
            // set version controller
            this.version = this.helpers.getVersion({ engine: true })
            this._version = schemizedParse(this.version, Object.keys(global._versionScheme), '.')

            // try to allocate thread
            while (typeof (process.runtime[this.thread]) !== "undefined") {
                this.thread += 1
            }
            if (typeof (process.runtime[this.thread]) === "undefined") {
                process.runtime[this.thread] = this
            }
            global.runtimeDeep = this.get.runtimeDeep()

            // create new moduleController
            const moduleController = require("./modules").default
            this.modules = new moduleController()

            // detect local mode
            try {
                const rootPkg = this.helpers.getRootPackage()

                if (rootPkg.name.includes("corenode") || rootPkg.name.includes("nodecore")) {
                    global.isLocalMode = true
                }
            } catch (error) {
                // terrible
            }

            // flag runtime as inited
            global._inited = true

            // warn local mode
            if (process.env.LOCAL_BIN == "true" && !global.isLocalMode) {
                console.warn("\n\x1b[7m", `⚠️  'LOCAL_BIN' environment flag is enabled, but this project is not allowed to run in local mode, ignoring running in local mode!`, "\x1b[0m\n")
            } else if (global.isLocalMode) {
                console.warn("\n\n\x1b[7m", `🚧  USING LOCAL DEVELOPMENT MODE  🚧`, "\x1b[0m\n\n")
            }

            // watch for load script
            if (typeof (load) === "object") {
                const { targetBin, isLocalMode } = load
                if (isLocalMode) {
                    global.isLocalMode = true
                }
                if (targetBin) {
                    try {
                        if (!fs.existsSync(targetBin)) {
                            throw new Error(`Cannot read loader script [${targetBin}]`)
                        }
                        require(targetBin)
                    } catch (error) {
                        verbosity.dump(error)
                        verbosity.error(`Runtime loader catch error > ${error.message}`)
                    }
                }
            }
        })
    }

    get = {
        environmentFiles: () => environmentFiles,
        runtimeDeep: () => Object.keys(process.runtime).length,
        paths: {
            _env: () => path.resolve(process.cwd(), '.corenode'),
            _src: () => path.resolve(__dirname, ".."),
            _root: () => path.resolve(__dirname, '../../..')
        }
    }

    run = {
        call: () => {

        },
        create: () => {

        },
    }

    setGlobals() {
        const { globals } = require("@corenode/builtin-lib")

        new globals(["corenode_cli", "corenode"])
        const keywords = ["_packages", "_env",]

        keywords.forEach((key) => {
            if (typeof (global[key]) === "undefined") {
                global[key] = {}
            }
        })

        global._versionScheme = { mayor: 0, minor: 1, patch: 2 }
        global.isLocalMode = false

        global._envpath = this.get.paths._env()
        global._runtimeSource = this.get.paths._src()
        global._runtimeRoot = this.get.paths._root()

        // TODO: Solve freeze function object
        global._setPackage = Object.freeze((key, path) => {
            global._packages[key] = path
        })
        global._delPackage = Object.freeze((key) => {
            delete global._packages[key]
        })

        global._setPackage("_engine", path.resolve(__dirname, '../../package.json'))
        global._setPackage("_project", path.resolve(process.cwd(), 'package.json'))
    }

    setEnvironment() {
        environmentFiles.forEach(file => {
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

    init() {
        return new Promise((resolve, reject) => {
            try {
                if (!global._inited) {
                    this.setGlobals()
                    this.setEnvironment()
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
    ...require("./helpers"),
}