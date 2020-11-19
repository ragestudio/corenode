import assert from 'assert';
import { getBundleAndConfigs } from '../buildDevUtils';
export default (api) => {
    api.registerCommand({
        name: 'webpack',
        description: 'inspect webpack configurations',
        async fn() {
            const { bundleConfigs } = await getBundleAndConfigs({ api });
            let config = bundleConfigs.filter((bundleConfig) => {
                return bundleConfig.entry?.umi;
            })[0];
            assert(config, `No valid config found with umi entry.`);
            if (api.args.rule) {
                config = config.module.rules.find((r) => r.__ruleNames[0] === api.args.rule);
            }
            else if (api.args.plugin) {
                config = config.plugins.find((p) => p.__pluginName === api.args.plugin);
            }
            else if (api.args.rules) {
                config = config.module.rules.map((r) => r.__ruleNames[0]);
            }
            else if (api.args.plugins) {
                config = config.plugins.map((p) => p.__pluginName || p.constructor.name);
            }
            if (api.args.print !== false) {
                console.log(config);
            }
            return config;
        },
    });
};
