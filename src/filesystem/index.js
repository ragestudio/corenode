const fastGlob = require('fast-glob')

function match(match = ["**"], options = { cwd: process.cwd()}) {
    return fastGlob(match, options)
}

function matchSync(match = ["**"], options = { cwd: process.cwd()}) {
    return fastGlob.sync(match, options)
}

module.exports = {
    match,
    matchSync
}