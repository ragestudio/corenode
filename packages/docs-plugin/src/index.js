
import { getPackages, getProyectEnv } from '@ragestudio/nodecorejs'
// import ESDoc from 'esdoc'
import Docma from 'docma'
import path from 'path'
import { verbosity } from '@nodecorejs/utils'

const engines = {
    Docma: async (params) => {
        if (!params.pkgs) {
            return false
        }
        let include = []
        let sourceObject = {}

        let { includeTypes } = params.options ?? ["js"]
        const { fromDist } = params.options
        
        if (Array.isArray(params.pkgs)) {
            params.pkgs.forEach((pkg) => {
                const dir = path.resolve(process.cwd(), `./${pkg}/${fromDist? "dist" : "src"}`)
                sourceObject[pkg] = []

                if (Array.isArray(includeTypes)) {
                    return includeTypes.forEach((type) => {
                        if (params.options?.innerFiles ?? false) {
                            include.push(`${dir}/**/*.${type}`)
                        }
                        return sourceObject[pkg].push(`${dir}/**/*.${type}`)
                    })
                }
                return include.push(dir)
            })
        }

        include.push(sourceObject)        
        console.log(include)

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

        await Docma.create().build(conf).then(success => {
            console.log('Documentation is built successfully.')
        }).catch(error => {
            console.log(error.stack)
        })
    },
    // ESDoc: (params) => {
    //     let conf = {
    //         source: params.source,
    //         destination: params.destination,
    //         plugins: params.plugins
    //     }
    //     console.log(conf)
    //     ESDoc.generate(conf)
    // },
    // JSDoc: (params) => {
    //     let conf = {
    //         source: params.source,
    //         destination: params.destination,
    //         plugins: params.plugins
    //     }
    //     console.log(conf)
    //     ESDoc.generate(conf)
    // }
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
            ...params,
            cleanBefore: params.clean,
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

        const pkgsFromRuntime = getProyectEnv().devRuntime?.docs
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

    if (pkgs.length <= 0) {
        pkgs.push(opts.source)
    }

    if (typeof (engines[opts.engine]) !== "function") {
        return console.error(`⛔️  Invalid engine for docs generation !`)
    }

    try {
        console.log(`📕  [${opts.engine}] Generating docs for packages [${pkgs}]\n`)
        engines[opts.engine]({ ...opts, pkgs })
    } catch (error) {
        verbosity.error(`Failed to generate docs`)
    }
}

export default generateDocs