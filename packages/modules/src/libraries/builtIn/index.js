import { Aliaser, Globals } from "@nodecorejs/dot-runtime/dist/classes"

module.exports = {
    load: {
        Aliaser,
        Globals,
        cli: {
            add: (command) => {
                if (typeof (command) == "object") {
                    if (typeof (global.nodecore_cli.custom) == "undefined") {
                        global.nodecore_cli.custom = []
                    }
                    global.nodecore_cli.custom.push(command)
                }
            },
            // TODO
            call: (command) => {
                return false
            }
        },
        // TODO
        registerModule: () => {

        },
        // TODO
        unloadModule: () => {

        },
    }
}