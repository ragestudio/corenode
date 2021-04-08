#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const prodCliBin = path.resolve(__dirname, '../../../node_modules/@nodecorejs/cli/dist')
const localCliBin = `${process.cwd()}/packages/cli/dist`
const localPkgJson = `${process.cwd()}/package.json`

let isLocalMode = false
let targetBin = null

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

if (isLocalMode) {
    targetBin = localCliBin
} else {
    targetBin = prodCliBin
}

if (process.env.LOCAL_BIN == "true" && !isLocalMode) {
    console.warn("\n\x1b[7m", `⚠️  'LOCAL_BIN' environment flag is enabled, but this project is not allowed to run in local mode, ignoring running in local mode!`, "\x1b[0m\n")
} else if (isLocalMode) {
    console.warn("\n\n\x1b[7m", `🚧  USING LOCAL DEVELOPMENT MODE  🚧`, "\x1b[0m\n\n")
}

try {
    if (!fs.existsSync(targetBin)) {
        throw new Error(`${isLocalMode ? "[LOCALBIN]" : ""} CLI Binaries is missing > Should : [${targetBin}]`)
    }

    const { aliaser } = require('@nodecorejs/builtin-lib')
    const cliScript = path.resolve(__dirname, "../../cli/dist")
    const { Runtime } = require('../dist/index.js')

    new aliaser({ "@@cli": cliScript })

    if (process.env.DEBUGGER) {
        let file = null

        const fromArguments = process.argv[2]
        const fromCWD = process.cwd()

        try {
            const from = fromArguments || fromCWD
            if (!fs.existsSync(from)) {
                throw new Error(`File not exists [${from}]`)
            } else {
                file = path.resolve(from)
            }
        } catch (error) {
            console.error(`Error catching file > ${error}`)
        }

        if (file) {
            new Runtime(file)
        }
    } else {
        new Runtime('../dist/cli/index.js')
    }
} catch (error) {
    fs.writeFileSync(path.resolve(process.cwd(), '.error.log'), error.stack, { encoding: "utf-8" })
    console.log(`❌ Critical error > ${error.message}`)
}