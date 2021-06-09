const fs = require('fs')
const path = require('path')
const { compile } = require('nexe')

const buildsPath = path.resolve(process.cwd(), "./build")
const nodeVersion = `16.1.0`
const targets = ["mac-x64", "linux-x64", "win-x64", "alpine-x64"]

if (!fs.existsSync(buildsPath)) {
    fs.mkdirSync(buildsPath)
}

async function build() {
    for await (const target of targets) {
        const buildPath = path.join(buildsPath, target)
        const t = `${target}-${nodeVersion}`
        const output = `${buildPath}/corenode`

        if (!fs.existsSync(buildPath)) {
            await fs.mkdirSync(buildPath)
        }

        await compile({
            input: './packages/corenode/bin/index.js',
            output: output,
            target: t,
            build: true,
            verbose: true,
            silent: false,
            resources: [`./packages/corenode/package.json`]
        })
    }
}

module.exports = build