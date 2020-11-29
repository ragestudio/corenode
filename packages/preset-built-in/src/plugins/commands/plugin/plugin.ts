import { IApi } from '@nodecorejs/types';
import { chalk, lodash } from '@nodecorejs/utils';

export default (api: IApi) => {
  api.registerCommand({
    name: 'plugin',
    description: 'inspect nodecore plugins',
    details: `
# List plugins
$ nodecore plugin list

# List plugins with key
$ nodecore plugin list --key
    `.trim(),
    fn({ args }) {
      const command = args._[0];
      switch (command) {
        case 'list':
          list();
          break;
        default:
          throw new Error(`Unsupported sub command ${command} for nodecore plugin.`);
      }

      function list() {
        console.log();
        console.log(`  Plugins:`);
        console.log();
        Object.keys(api.service.plugins).forEach((pluginId) => {
          const plugin = api.service.plugins[pluginId];
          const keyStr = args.key
            ? ` ${chalk.blue(`[key: ${[plugin.key]}]`)}`
            : '';
          const isPresetStr = plugin.isPreset
            ? ` ${chalk.green('(preset)')}`
            : '';
          console.log(`    - ${plugin.id}${keyStr}${isPresetStr}`);
        });
        console.log();
      }
    },
  });
};
