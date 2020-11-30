import { chalk } from '@nodecorejs/libs';
export default (api) => {
    api.registerCommand({
        name: 'config',
        description: 'nodecore config cli',
        details: `
# List configs
$ nodecore config list

# List the specific config
$ nodecore config list --name history
    `.trim(),
        fn({ args }) {
            const command = args._[0];
            switch (command) {
                case 'list':
                    list();
                    break;
                default:
                    throw new Error(`Unsupported sub command ${command} for nodecore config.`);
            }
            function list() {
                const getValue = (value) => {
                    if (typeof value !== 'function') {
                        return value;
                    }
                    return chalk.yellow('The value data type does not support the view');
                };
                const print = (key) => {
                    console.log(` - ${chalk.blue(`[key: ${key}]`)}`, getValue(api.config[key]));
                    console.log();
                };
                console.log();
                console.log(`  Configs:`);
                console.log();
                if (args.name) {
                    if (!api.config[args.name]) {
                        // current key not existed
                        throw new Error(`key ${args.name} not found`);
                    }
                    print(args.name);
                }
                else {
                    // list all
                    Object.keys(api.config).forEach((key) => {
                        print(key);
                    });
                }
                console.log();
            }
        },
    });
};
