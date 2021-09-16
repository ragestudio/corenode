const { EvalMachine } = require('corenode/vm')
const filesize = require('filesize')
const { performance } = require('perf_hooks')

let deep = 1500

let p0 = null

function showProcessMem() {
    let processMem = process.memoryUsage()

    processMem.rss = filesize(processMem.rss)
    processMem.heapTotal = filesize(processMem.heapTotal)
    processMem.heapUsed = filesize(processMem.heapUsed)

    console.log(`\n`)
    console.log(processMem)
}

function end() {
    const tooks = (performance.now() - p0).toFixed(2)

    showProcessMem()
    console.log(`\n`)
    console.log(`| Allocated [${deep}] EvalMachines | 🕗  Tooks ${tooks}ms |`)
}

function init() {
    p0 = performance.now()

    for (let index = 0; index < deep; index++) {
        const machine = new EvalMachine()
        machine.run(`
            5*5/${Math.random().toFixed(2)}
        `, () => {
            if ((index + 1) == deep) {
                end()
            }
        })    
    }
}

init()

