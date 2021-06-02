#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")
const open = require("open")
const yparser = require("yargs-parser")

const localPkgJson = `${process.cwd()}/package.json`
const fatalCrashLogFile = path.resolve(process.cwd(), '.crash.log')

const args = yparser(process.argv)

let targetBin = null
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
    const { Runtime } = require('../dist/index.js')

    let options = {
        runCli: true,
        isLocalMode,
        cwd: args.cwd,
        args: args,
    }
    
    new Runtime(options)
    console.log(`\n`) // leaving some space between lines
} catch (error) {
    const now = new Date()
    const err = `
    --------------------
    \n
    🆘 >> [${now.toLocaleDateString()} ${now.toLocaleTimeString()}]
    \n\t ${error.stack}
    \n
    --------------------\n
    `

    fs.appendFileSync(fatalCrashLogFile, err, { encoding: "utf-8" })
    console.log(`[🆘 CRASH] 🛑 Critical error > ${error.message}`)
    console.log(`🗒  Open '${fatalCrashLogFile}' for more details >> ${fatalCrashLogFile}`)
    try {
        open(fatalCrashLogFile)
    } catch (error) {
        // fatality, something is really broken ._.
    }
}