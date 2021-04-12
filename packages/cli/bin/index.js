#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const cliDist = path.resolve(__dirname, '../dist')
const localPkgJson = `${process.cwd()}/package.json`

let fromArguments = process.argv[2]

let targetBin = cliDist // Default load cli
let isLocalMode = false

if (fs.existsSync(localPkgJson)) {
    try {
        const pkg = require(localPkgJson)
        if (pkg.name.includes("corenode") && process.env.LOCAL_BIN == "true") {
            isLocalMode = true
        }
    } catch (error) {
        console.log(`❌ Error processing package.json > ${error.message}`)
    }
}

try {
    if (!fs.existsSync(cliDist)) {
        throw new Error(`${isLocalMode ? "[LOCALBIN]" : ""} CLI Binaries is missing > Should : [${cliDist}]`)
    }

    if (fromArguments) {
        try {
            if (!path.isAbsolute(fromArguments)) {
                fromArguments = path.resolve(fromArguments)
            }

            // plesss, better fs.access api ._.
            if (fs.readFileSync(fromArguments)) {
                targetBin = fromArguments
            }
        } catch (error) {
            // terrible, no access?
        }
    }

    if (process.env.DEBUG == "true") {
        targetBin = path.resolve(fromArguments)
    }

    const { aliaser } = require('@corenode/builtin-lib')
    const { Runtime } = require('corenode')

    new aliaser({ "@@cli": cliDist })
    new Runtime({
        targetBin,
        isLocalMode: isLocalMode ? isLocalMode : false
    })
    console.log(`\n`) // leaving some space between lines
} catch (error) {
    fs.writeFileSync(path.resolve(process.cwd(), '.error.log'), error.stack, { encoding: "utf-8" })
    console.log(`❌ Critical error > ${error.message}`)
}