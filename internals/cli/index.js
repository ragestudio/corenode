const generate = require('./lib/generate')

let optionsMap = require('./options')
let commandMap = require('./commands')

function runCli() {
    generate({
        options: optionsMap,
        commands: commandMap
    })
}

module.exports = runCli