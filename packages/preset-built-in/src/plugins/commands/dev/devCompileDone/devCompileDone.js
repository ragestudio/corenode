import { yParser } from '@nodecorejs/libs';
import DevCompileDonePlugin from './DevCompileDonePlugin';
const args = yParser(process.argv.slice(2));
export default (api) => {
    api.modifyBundleConfig((bundleConfig, { env, bundler: { id }, type }) => {
        if (env === 'development' && id === 'webpack') {
            bundleConfig.plugins?.push(new DevCompileDonePlugin({
                port: api.getPort(),
                hostname: api.getHostname(),
                https: !!(api.config?.devServer?.https ||
                    process.env.HTTPS ||
                    args?.https),
                onCompileDone({ isFirstCompile, stats }) {
                    if (isFirstCompile) {
                        api.service.emit('firstDevCompileDone');
                    }
                    api.applyPlugins({
                        key: 'onDevCompileDone',
                        type: api.ApplyPluginsType.event,
                        args: {
                            isFirstCompile,
                            type,
                            stats,
                        },
                    })
                        .catch((e) => { });
                },
                onCompileFail() { },
            }));
        }
        return bundleConfig;
    });
};
