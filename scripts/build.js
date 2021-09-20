#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { buildAllPackages, buildSource } = require('../builder')

const parallel = process.argv.includes("--parallel")

let tasks = [
    () => _buildAllPackages(),
    () => _buildSource(),
]

const _buildAllPackages = async () => {
    const packagesPath = path.join(process.cwd(), 'packages')

    if (fs.existsSync(packagesPath) && fs.lstatSync(packagesPath).isDirectory()) {
        console.log(`⚙️  Building all packages\n`)
        await buildAllPackages()
    }
}

const _buildSource = async () => {
    const sourcePath = path.join(process.cwd(), 'src')

    if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isDirectory()) {
        console.log(`⚙️  Building source\n`)
        await buildSource()
    }
}

async function syncPackageManifest() {
    console.log(`⚙️  Syncing package manifest\n`)

    let rootPackage = require(path.resolve(process.cwd(), 'package.json'))

    // fix main script
    rootPackage.main = "./index.js"

    fs.writeFileSync(path.resolve(process.cwd(), 'dist/package.json'), JSON.stringify(rootPackage, null, 2))
}

async function _main() {
    if (parallel) {
        await Promise.all(tasks.map((fn) => fn()))
    } else {
        for (const fn of tasks) {
            await fn()
        }
    }

    await syncPackageManifest()
    console.log(`\n🎉  Done!\n`)
}

_main().catch((e) => {
    console.error("Unhandled error:")
    console.error(e)
    process.exitCode = 1
})
