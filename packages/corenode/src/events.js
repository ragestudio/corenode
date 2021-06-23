module.exports = [
    {
        on: "cli_noCommand",
        event: () => {
            const repl = require('./repl')
            repl.attachREPL()
        } 
    }
]