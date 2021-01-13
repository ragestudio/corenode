
import { getPackages, getDevRuntimeEnv } from '@nodecorejs/dot-runtime'
import ESDoc from 'esdoc'
import Docma from 'docma'
import path from 'path'

const engines = {
    Docma: async (params) => {
        let include = [
            `${params.source}/**/*.js`,
        ]

        if (typeof (params.options) !== "undefined") {
            const { includeTypes } = params.options
            if (Array.isArray(includeTypes)) {
                includeTypes.forEach((type) => {
                    const incl = `${params.source}/**/*.${type}`

                    if (!include.includes(incl)) {
                        include.push(incl)
                    }
                })
            }
        }

        let conf = {
            src: include,
            dest: params.destination,
            clean: params.options?.cleanBefore ?? true,
            debug: params.options?.debug ?? false,
            jsdoc: {
                recurse: true,
                // plugins: [
                //     "jsdoc-plugin-typescript"
                // ],
                ...params.jsdoc
            }
        }
        let appOptions = {
            base: path.resolve(process.cwd(), conf.dest)
        }


        if (typeof (params.options.app) !== "undefined") {
            appOptions = { ...appOptions, ...params.options.app }
        }

        // if (typeof (params.plugins) !== "undefined" && Array.isArray(params.plugins)) {
        //     params.plugins.forEach((plugin) => {
        //         if (!conf.jsdoc.plugins.includes(plugin)) {
        //             conf.jsdoc.plugins.push(plugin)
        //         }
        //     })
        // }

        await Docma.create().build({ ...conf, appOptions }).then(success => {
            console.log('Documentation is built successfully.')
        }).catch(error => {
            console.log(error.stack)
        })
    },
    ESDoc: (params) => {
        let conf = {
            source: params.source,
            destination: params.destination,
            plugins: params.plugins
        }
        console.log(conf)
        ESDoc.generate(conf)
    }
}

export function generateDocs(params) {
    const buildFromProyect = params.proyect ?? true
    let opts = {
        engine: params.engine ?? "Docma",
        source: "./src",
        destination: params.destination ?? "./docs",
        plugins: [
            {
                name: "esdoc-standard-plugin"
            },
        ],
        options: {
            debug: params.debug,
            app: params.app,
            includes: [],
            includeTypes: ["js", "ts"]
        },
        jsdoc: {
            ...params.jsdoc
        }
    }

    let pkgs = []

    if (typeof (params.plugins) !== "undefined" && Array.isArray(params.plugins)) {
        params.plugins.forEach(plugin => {
            if (typeof (plugin) !== "object") {
                return opts.plugins.push({
                    name: plugin
                })
            }
            opts.plugins.push(plugin)
        })
    }

    if (typeof (params.dir) == "string") {
        pkgs.push(params.dir)
    }

    if (buildFromProyect) {
        let includes = []

        const pkgsFromRuntime = getDevRuntimeEnv().docs
        const allPackages = getPackages()

        if (typeof (pkgsFromRuntime) !== "undefined") {
            includes = pkgsFromRuntime
        } else {
            includes = allPackages
        }

        includes.forEach((pkg) => {
            pkgs.push(`packages/${pkg}`)
        })
    }

    if (!pkgs.length > 0) {
        pkgs.push(opts.source)
    }

    console.log(pkgs)
    pkgs.forEach((pkg) => {
        const dir = path.resolve(process.cwd(), `./${pkg}/dist`)

        if (typeof (engines[opts.engine]) !== "function") {
            return console.error(`⛔️  Invalid engine for docs generation !`)
        }

        console.log(`📕  [${opts.engine}] Generating docs for package [${pkg}] > ${dir}\n`)
        engines[opts.engine]({ ...opts, source: dir })
    })
}