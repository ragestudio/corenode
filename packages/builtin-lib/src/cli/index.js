export default {
    argv: process.argv,
    add: (command) => {
        if (typeof (command) == "object") {
            if (typeof (global.corenode_cli.custom) == "undefined") {
                global.corenode_cli.custom = []
            }
            global.corenode_cli.custom.push(command)
        }
    },
}