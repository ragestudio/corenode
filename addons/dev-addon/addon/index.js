const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const md5 = require('md5')

const { EvalMachine } = require('corenode/vm')
const { Builder } = require('@@internals/builder')

class Watcher {
    constructor(params) {
        this.params = params ?? {}

        this.deep = []
        this.changes = new Set()
        this.checksums = new WeakSet()

        this.lastChecksum = null
        this.lastChange = null

        if (typeof this.params.input === "undefined") {
            throw new Error(`No input to watch provided`)
        }

        this.watchDir = fs.lstatSync(this.params.input).isFile? this.params.input : path.dirname(this.params.input)
        this.watcher = chokidar.watch(this.watchDir)

        this.timeout = null

        this.watcher.on("change", (file) => {
            this.onFileChange(file)
        })

        this.watcher.on("all", (event, file) => {
            console.log(`\n\n------------`)
            console.log(`[${event}] >> ${file}`)
            console.log(`------------\n\n`)
            
            clearTimeout(this.timeout)

            this.timeout = setTimeout(() => {
                this.runtime()
            }, 1000)
        })
    }

    onFileChange = (file) => {
        try {
            const fileContent = fs.readFileSync(file, 'utf8')
            const time = new Date().getTime()
            const hash = String(md5(fileContent))

            const change = { hash, time }

            if (this.lastChecksum !== hash) {
                this.lastChecksum = hash
                this.lastChange = change

                this.checksums.add({ hash })
                this.changes.add(change)
            }
        } catch (error) {
            console.log(error)
            console.error(`Failed watch file > ${error.message}`)
        }
    }

    build = async () => {
        return new Builder({ source: this.watchDir, showProgress: false }).buildAllSources()
    }

    runtime = async () => {
        if (this.deep.length > 0) {
            console.log(`\n\n------------`)
            console.log(`>> [MACHINE RELOAD] | checksum ${this.lastChecksum} | time ${this.lastChange?.time ?? "unknown"} <<`)
            console.log(`------------\n\n`)
            this.deep.forEach((machine) => {
                machine.destroy()
            })
        }

        if (this.params.buildDist) {
            console.log(`\n ⚙️  Compiling...`)
            await this.build()
            console.log(`Build Done`)
        }

        try {
            const machine = new EvalMachine({
                file: this.params.exec ?? this.params.input
            })

            this.deep.push(machine)
        } catch (error) {
            console.error(error)
        }
    }
}

function watch(payload) {
    return new Watcher(payload)
}

runtime.appendToCli({
    command: "dev [input] [exec]",
    exec: (context, args) => {
        watch({ input: args.input, exec: args.exec, buildDist: args.dist, })
    }
})

expose = {
    Watcher,
    watch
}