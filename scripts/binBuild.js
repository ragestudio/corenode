const fs = require('fs')
const path = require('path')
const { compile } = require('nexe')

const buildsPath = path.resolve(process.cwd(), "./build")
const nodeVersion = `16.1.0`
const targets = ["mac-x64", "linux-x64", "win-x64"]

if (!fs.existsSync(buildsPath)) {
    fs.mkdirSync(buildsPath)
}

targets.forEach((target) => {
    const buildPath = path.join(buildsPath, target)
    const t = `${target}-${nodeVersion}`
    const output = `${buildPath}/corenode`

    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath)
    }

    compile({
        input: './packages/corenode/bin/index.js',
        output: output,
        build: true,
        verbose: false,
        silent: true,
        target: t,
        resources: [`./packages/corenode/package.json`]
    }).then(() => {
        console.log(`[${t}] Compiling done!`)
    })
})