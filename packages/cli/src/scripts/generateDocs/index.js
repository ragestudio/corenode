
import { getPackages } from '@nodecorejs/dot-runtime'
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
            }
        ]
    }

    let pkgs = []

    if (typeof(params.plugins) !== "undefined" && Array.isArray(params.plugins) ) {
        params.plugins.forEach(plugin => {
            opts.plugins.push({
                name: plugin
            })
        })
    }

    if (typeof(params.dir) == "string") {
        pkgs.push(params.dir)
    }

    if (buildFromProyect) {
        getPackages().forEach((pkg) => {
            pkgs.push(`packages/${pkg}`)
        })
    }
    
    if (!pkgs.length > 0) {
        pkgs.push(opts.source)
    }

    console.log(pkgs)
    pkgs.forEach((pkg) => {
        console.log(pkg)
        ESDoc.generate({ ...opts, source: path.resolve(__dirname, pkg) })
    })
}