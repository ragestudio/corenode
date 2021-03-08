#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")
const { fork, spawn, execFileSync } = require("child_process")

const prodCliBin = path.resolve(__dirname, '../node_modules/@nodecorejs/cli/dist')
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

// INIT
if (process.env.LOCAL_BIN == "true" && !isLocalMode) {
    console.warn("\n\x1b[7m", `⚠️  'LOCAL_BIN' environment flag is enabled, but this proyect is not allowed to run in local mode, ignoring running in local mode!`, "\x1b[0m\n")
} else if (isLocalMode) {
    console.warn("\n\n\x1b[7m", `🚧  USING LOCAL DEVELOPMENT MODE  🚧`, "\x1b[0m\n\n")
}

try {
    if (!fs.existsSync(targetBin)) {
        throw new Error(`${isLocalMode ? "[LOCALBIN]" : ""} CLI Binaries is missing > Should : [${targetBin}]`)
    }

    if (process.env.DEBUGGER) {
        let file = null

        const fromArguments = process.argv[2]
        const fromCWD = process.cwd()

        try {
            const from = fromArguments || fromCWD
            if (!fs.existsSync(from)) {
                throw new Error(`File not exists [${from}]`)
            } else {
                file = from
            }
        } catch (error) {
            console.error(`Error catching file > ${error}`)
        }

        if (file) {
            try {
                const filePathname = path.dirname(file)
                const fileBasename = path.basename(file)
                const pathFromDist = filePathname.replace("src", "dist")

                file = path.resolve(pathFromDist, fileBasename)

                const _node = spawn(`node`, [`--trace-deprecation`, `${file}`], { cwd: fromCWD })
                //const _node = spawn(`${fromCWD}/node_modules/.bin/nodemon`, [`--exec babel-node`, `${file}`])

                _node.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`)
                })

                _node.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`)
                })

                _node.on('close', (code) => {
                    console.log(`child process exited with code ${code}`)
                })
            } catch (error) {
                console.error(`Error exec debug > ${error}`)
            }
        }
    } else {
        const { Runtime } = require(targetBin)
        new Runtime({ mode: 'cli' })
    }
} catch (error) {
    fs.writeFileSync(path.resolve(process.cwd(), '.error.log'), error.stack, { encoding: "utf-8" })
    console.log(`❌ Critical error > ${error.message}`)
}