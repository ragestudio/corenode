export default {
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
}