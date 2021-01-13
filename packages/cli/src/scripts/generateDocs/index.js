
import { getPackages, getDevRuntimeEnv } from '@nodecorejs/dot-runtime'
import ESDoc from 'esdoc'
import Docma from 'docma'
import path from 'path'

const engines = {
    Docma: (params) => {
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
            clean: params.options.cleanBefore ?? true
        }
        Docma.create().build(conf)
    },
    ESDoc: (params) => {
        let conf = {
            source: params.source,
            destination: params.destination,
            plugins: params.plugins
        }
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
            includes: [],
            includeTypes: ["js", "ts"]
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
            pkgs.push(`packages/${pkg}/src`)
        })
    }

    if (!pkgs.length > 0) {
        pkgs.push(opts.source)
    }

    console.log(pkgs)
    pkgs.forEach((pkg) => {
        const dir = path.resolve(process.cwd(), pkg)

        if (typeof (engines[opts.engine]) !== "function") {
            return console.error(`⛔️  Invalid engine for docs generation !`)
        }

        console.log(`📕  [${opts.engine}] Generating docs for package [${pkg}] > ${dir}\n`)
        engines[opts.engine]({ ...opts, source: dir })
    })
}