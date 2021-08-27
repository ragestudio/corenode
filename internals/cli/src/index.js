import generate from './lib/generate'

let optionsMap = require('./options')
let commandMap = require('./commands')

export function runCli() {
    generate({
        options: optionsMap,
        commands: commandMap
    })
}

runCli()