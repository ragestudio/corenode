#!/usr/bin/env node
const { Runtime, events } = require('../dist/index.js')

function loadRuntime(options) {
    return new Runtime(options)
}

try {
    //* load runtime 
    loadRuntime({
        runCli: true
    }).initialize()

    console.log(`\n`) // leaving some space between lines
} catch (error) {
    events.fatalCrash(error)
}