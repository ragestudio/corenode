#!/usr/bin/env node
const { Runtime, events } = require('../../dist/index.js')

function createRuntime(options) {
    return new Runtime(options)
}

async function _main() {
    try {
        //* load runtime 
        const runtime = createRuntime()

        await runtime.initialize()
        await runtime.target()

        console.log(`\n`) // leaving some space between lines
    } catch (error) {
        console.log(error)
        events.fatalCrash(error)
    }
}

_main()