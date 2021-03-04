#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const prodCliBin = path.resolve(__dirname, '../node_modules/@nodecorejs/cli/dist')
const localCliBin = `${process.cwd()}/packages/cli/dist`
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
    targetBin = localCliBin
} else {
    targetBin = prodCliBin
}

// INIT
if (process.env.LOCAL_BIN && !isLocalMode) {
    console.warn(`This runtime is running with 'LOCAL_BIN=true' flag but the 'local' flag is returning false, ignoring running in local runtime!`)
} else if (isLocalMode) {
    console.warn("\n\n\x1b[7m", `🚧  USING LOCAL DEVELOPMENT MODE  🚧`, "\x1b[0m\n\n")
}

try {
    const { Globals, Aliaser } = require("@nodecorejs/builtin-lib")

    if (!fs.existsSync(targetBin)) {
        throw new Error(`${isLocalMode ? "[LOCALBIN]" : ""} CLI Binaries is missing > Should : [${targetBin}]`)
    }

    new Aliaser({ "@@nodecore": path.resolve(__dirname, '../dist') })
    new Globals(["nodecore_cli", "nodecore", "nodecore_modules"])

    require(targetBin)
} catch (error) {
    fs.writeFileSync(path.resolve(process.cwd(), '.error.log'), error.stack, { encoding: "utf-8" })
    console.log(`❌ Critical error > ${error.message}`)
}