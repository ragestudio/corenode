const fs = require('fs')
const colors = require('colors')

const { EvalMachine } = require('corenode/dist/vm')
const getChecksum = require('corenode/dist/libs/checksum').default

class Watcher {
    constructor(params) {
        this.params = params ?? {}

        this.deep = []
        this.changes = new Set()
        this.checksums = new WeakSet()

        this.lastChecksum = null
        this.lastChange = null

        if (typeof this.params.file === "undefined") {
            throw new Error(`No file to watch provided`)
        }

        this.runtime()

        fs.watch(this.params.file, (eventType, filename) => {
            this.onEvent({ eventType, filename })
        })
    }

    onEvent = (event) => {
        switch (event.eventType) {
            case "change": {
                this.onFileChange(event)
                break
            }
            default:
                break
        }
    }

    onFileChange = (event) => {
        try {
            const fileContent = fs.readFileSync(this.params.file, 'utf8')
            const time = new Date().getTime()
            const hash = String(getChecksum(fileContent))

            const change = { event, hash, time }
            if (this.lastChecksum !== hash) {
                this.lastChecksum = hash
                this.lastChange = change

                this.checksums.add({hash})
                this.changes.add(change)

                this.runtime()
            }
        } catch (error) {
            console.log(error)
            console.error(`Failed watch file > ${error.message}`)
        }
    }

    runtime = () => {
        if (this.deep.length > 0) {
            console.log(`\n\n------------`)
            console.log(colors.bgYellow(`>> [MACHINE RELOAD] | checksum ${this.lastChecksum} | time ${this.lastChange?.time ?? "unknown"} <<`))
            console.log(`------------\n\n`)
            this.deep.forEach((machine) => {
                machine.destroy()
            })
        }

        try {
            const machine = new EvalMachine({
                file: this.params.file
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

expose = {
    Watcher,
    watch
}