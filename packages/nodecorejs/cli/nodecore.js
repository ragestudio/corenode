#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const prodBin = path.resolve(__dirname, '../node_modules/@nodecorejs/cli/dist')
const localBin = `${process.cwd()}/packages/cli/dist`
const localPkgJson = `${process.cwd()}/package.json`

let isLocalMode = false
let targetBin = null

if (fs.existsSync(localPkgJson)) {
    try {
        const pkg = require(localPkgJson)
        if (pkg.name === "nodecorejs") {
            isLocalMode = true
        }
    } catch (error) {
        console.log(`❌ Error processing package.json > ${error.message}`)
    }
}

if (isLocalMode) {
    targetBin = localBin
} else {
    targetBin = prodBin
}

try {
    if (!fs.existsSync(targetBin)) {
        throw new Error(`${isLocalMode ? "[LOCALBIN]" : ""} CLI Script not exists > Should : [${targetBin}]`)
    }
    require(targetBin)
} catch (error) {
    console.log(`❌ Critical error > ${error.message}`)
}