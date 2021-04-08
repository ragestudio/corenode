#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const cliDist = path.resolve(__dirname, '../dist')
const localPkgJson = `${process.cwd()}/package.json`

const fromArguments = process.argv[2]

let targetBin = cliDist // Default load cli
let isLocalMode = false

if (fs.existsSync(localPkgJson)) {
    try {
        const pkg = require(localPkgJson)
        if (pkg.name === "nodecorejs" && process.env.LOCAL_BIN == "true") {
            isLocalMode = true
        }
    } catch (error) {
        console.log(`❌ Error processing package.json > ${error.message}`)
    }
}

if (process.env.LOCAL_BIN == "true" && !isLocalMode) {
    console.warn("\n\x1b[7m", `⚠️  'LOCAL_BIN' environment flag is enabled, but this project is not allowed to run in local mode, ignoring running in local mode!`, "\x1b[0m\n")
} else if (isLocalMode) {
    console.warn("\n\n\x1b[7m", `🚧  USING LOCAL DEVELOPMENT MODE  🚧`, "\x1b[0m\n\n")
}

try {
    if (!fs.existsSync(cliDist)) {
        throw new Error(`${isLocalMode ? "[LOCALBIN]" : ""} CLI Binaries is missing > Should : [${cliDist}]`)
    }

    if (fromArguments) {
        if (path.isAbsolute(fromArguments) && fs.existsSync(fromArguments)) {
            targetBin = fromArguments
        }
    }
    
    if (process.env.DEBUG == "true") {
        targetBin = path.resolve(fromArguments)
    }

    const { aliaser } = require('@nodecorejs/builtin-lib')
    const { Runtime } = require('nodecorejs')

    new aliaser({ "@@cli": cliDist })
    new Runtime(targetBin)
    console.log(`\n`) // leaving some space between lines
} catch (error) {
    fs.writeFileSync(path.resolve(process.cwd(), '.error.log'), error.stack, { encoding: "utf-8" })
    console.log(`❌ Critical error > ${error.message}`)
}