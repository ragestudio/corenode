
require("child_process").exec(`npx`, ["packages/"])

const fs = require("fs")
const path = require("path")
const { fork, spawn, execFileSync } = require("child_process")

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