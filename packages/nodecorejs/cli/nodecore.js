#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const prodBin = path.resolve(__dirname, '../node_modules/@nodecorejs/cli/dist')
const localBin = `${process.cwd()}/packages/cli/dist`

let targetBin = null

process.env.LOCAL_BIN = false
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