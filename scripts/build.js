#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { buildAllPackages, buildSource } = require('../src/internals/builder')

async function buildProject() {
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

async function syncPackageManifest() {
    console.log(`⚙️  Syncing package manifest\n`)
    
    let rootPackage = require(path.resolve(process.cwd(), 'package.json'))
    
    // fix main script
    rootPackage.main = "./index.js"

    fs.writeFileSync(path.resolve(process.cwd(), 'dist/package.json'), JSON.stringify(rootPackage, null, 2))
}

async function _main(){
    await buildProject()
    syncPackageManifest()
    console.log(`\n🎉  Done!\n`)
}

_main()