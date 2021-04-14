import yparser from 'yargs-parser'

export default {
    argv: process.argv,
    args: yparser(process.argv.slice(2)),
    add: (command) => {
        if (typeof (command) == "object") {
            if (typeof (global.corenode_cli.custom) == "undefined") {
                global.corenode_cli.custom = []
            }
            global.corenode_cli.custom.push(command)
        }
    },
}