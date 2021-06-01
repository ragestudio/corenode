const fs = require("fs")
const path = require("path")

module.exports = {
    pkg: "dev",
    script: "./src/index.js",
    appendCli: [
        {
            command: "dev [file]",
            exec: (context, args) => {
                const script = context.machine.dispatcher()

                if (!args.file) {
                    // exit
                    return false
                }

                script.watch({ file: args.file })
            }
        }
    ]
}