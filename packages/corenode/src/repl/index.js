const { EvalMachine } = require('../vm')

class REPLMachine {
    constructor(params) {
        this.params = params ?? {}

        this.repl = require('repl')
        this.machine = new EvalMachine({
            lock: true
        })

        this.machine.onDestroy((address) => {
            console.error(`🛑 REPL VM[${address}] Has been destroyed`)
            process.exit()
        })
    }

    eval = (cmd, context, filename, callback) => {
        try {
            const out = this.machine.run(cmd, { babelTransform: false })
            return callback(null, out)
        } catch (error) {
            return callback(error.message)
        }
    }

    start = () => {
        console.log(`|  REPL Console  |`)
        console.log(`|  v${process.runtime.version} node_${process.versions.node}  |\n`)

        // weird bug, i had to put a timeout to prevent the prompt line spacing from failing
        setTimeout(() => {
            this.repl.start({
                prompt: `#> `,
                useColors: true,
                eval: this.eval,
                preview: true,
                terminal: true
            })
        }, 50)
    }
}

function attachREPL() {
    const repl = new REPLMachine()
    repl.start()

    return repl
}

export { REPLMachine, attachREPL }