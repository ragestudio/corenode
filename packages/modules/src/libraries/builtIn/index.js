import { Aliaser } from "@nodecorejs/dot-runtime/dist/classes"

module.exports = {
    load: {
        _getModulesPath: () => {
            return global.nodecore_modules.modulesPath
        },
        registerModule: () => {

        },
        unloadModule: () => {

        },
        cli: {
            add: (command) => {
                if (typeof (command) == "object") {
                    if (typeof (global.nodecore_cli.custom) == "undefined") {
                        global.nodecore_cli.custom = []
                    }
                    global.nodecore_cli.custom.push(command)
                }
            },
            call: (command) => {

            }
        },
        Aliaser
    }
}