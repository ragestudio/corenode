const builder = require("./src/index.js")
const path = require("path")
const fs = require("fs")

async function build(dirs) {
    const { buildAllPackages, buildSource, Builder } = builder

    if (dirs.length > 0) {
        dirs.forEach((dir) => {
            const basename = path.basename(dir)
            const output = path.resolve(dir, `../${basename}_dist`)

            new Builder({ source: dir, output: output, taskName: basename, showProgress: true }).buildAllSources()
        })
    } else {
        const packagesPath = path.join(process.cwd(), 'packages')
        const sourcePath = path.join(process.cwd(), 'src')

        if (fs.existsSync(packagesPath) && fs.lstatSync(packagesPath).isDirectory()) {
            console.log(`⚙️  Building all packages\n`)
            await buildAllPackages()
        }

        if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isDirectory()) {
            console.log(`⚙️  Building source\n`)
            await buildSource()
        }
    }
}

runtime.appendToCli({
    command: 'legacy_build',
    description: "Build project with builtin builder",
    arguments: ["[dirs...]"],
    exec: (dirs) => {
        return build(dirs)
            .then(() => {
                console.log('\n Build done!')
            })
            .catch((err) => {
                console.error(err)
                console.error('\n Build failed!', err.message)
            })
    }
})