#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { buildAllPackages, buildSource } = require('./index.js')

async function _main() {
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

_main()