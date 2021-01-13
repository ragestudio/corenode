
import { getPackages, getDevRuntimeEnv } from '@nodecorejs/dot-runtime'
import ESDoc from 'esdoc'
import path from 'path'

export function generateDocs(params) {
    const buildFromProyect = params.proyect ?? true
    let opts = {
        source: "./src",
        destination: params.destination ?? "./docs",
        plugins: [
            {
                name: "esdoc-standard-plugin"
            },
            {
                name: "esdoc-ecmascript-proposal-plugin",
                option: {
                    all: true
                }
            },
        ]
    }

    let pkgs = []

    if (typeof(params.plugins) !== "undefined" && Array.isArray(params.plugins) ) {
        params.plugins.forEach(plugin => {
            if (typeof(plugin) !== "object") {
                return opts.plugins.push({
                    name: plugin
                })
            }
            opts.plugins.push(plugin)
        })
    }

    if (typeof(params.dir) == "string") {
        pkgs.push(params.dir)
    }

    if (buildFromProyect) {
        let includes = []

        const pkgsFromRuntime = getDevRuntimeEnv().docs
        const allPackages = getPackages()

        if (typeof(pkgsFromRuntime) !== "undefined") {
            includes = pkgsFromRuntime
        }else {
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

        console.log(`📕 Generating docs for package [${pkg}] > ${dir}\n`)
        ESDoc.generate({ ...opts, source: dir })
    })
}