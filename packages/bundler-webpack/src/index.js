import { BundlerConfigType } from '@nodecorejs/types';
import defaultWebpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import { winPath } from '@nodecorejs/utils';
import getConfig from './getConfig/getConfig';
import { join } from 'path';
class Bundler {
    constructor({ cwd, config }) {
        /**
         * get ignored watch dirs regexp, for test case
         */
        this.getIgnoredWatchRegExp = () => {
            const { outputPath } = this.config;
            const absOutputPath = winPath(join(this.cwd, outputPath, '/'));
            // need ${sep} after outputPath
            return process.env.WATCH_IGNORED === 'none'
                ? undefined
                : new RegExp(process.env.WATCH_IGNORED || `(node_modules|${absOutputPath})`);
        };
        this.cwd = cwd;
        this.config = config;
    }
    async getConfig(opts) {
        return await getConfig({
            ...opts,
            cwd: this.cwd,
            config: this.config,
        });
    }
    async build({ bundleConfigs, bundleImplementor = defaultWebpack, }) {
        return new Promise((resolve, reject) => {
            const compiler = bundleImplementor(bundleConfigs);
            compiler.run((err, stats) => {
                if (err || stats.hasErrors()) {
                    try {
                        console.log(stats.toString('errors-only'));
                    }
                    catch (e) { }
                    console.error(err);
                    return reject(new Error('build failed'));
                }
                // @ts-ignore
                resolve({ stats });
            });
        });
    }
    setupDevServerOpts({ bundleConfigs, bundleImplementor = defaultWebpack, }) {
        const compiler = bundleImplementor(bundleConfigs);
        const { devServer } = this.config;
        // @ts-ignore
        const compilerMiddleware = webpackDevMiddleware(compiler, {
            // must be /, otherwise it will exec next()
            publicPath: '/',
            logLevel: 'silent',
            writeToDisk: devServer && devServer?.writeToDisk,
            watchOptions: {
                // not watch outputPath dir and node_modules
                ignored: this.getIgnoredWatchRegExp(),
            },
        });
        function sendStats({ server, sockets, stats, }) {
            server.sockWrite({ sockets, type: 'hash', data: stats.hash });
            if (stats.errors.length > 0) {
                server.sockWrite({ sockets, type: 'errors', data: stats.errors });
            }
            else if (stats.warnings.length > 0) {
                server.sockWrite({ sockets, type: 'warnings', data: stats.warnings });
            }
            else {
                server.sockWrite({ sockets, type: 'ok' });
            }
        }
        function getStats(stats) {
            return stats.toJson({
                all: false,
                hash: true,
                assets: true,
                warnings: true,
                errors: true,
                errorDetails: false,
            });
        }
        let _stats = null;
        return {
            compilerMiddleware,
            onListening: ({ server }) => {
                function addHooks(compiler) {
                    const { compile, invalid, done } = compiler.hooks;
                    compile.tap('umi-dev-server', () => {
                        server.sockWrite({ type: 'invalid' });
                    });
                    invalid.tap('umi-dev-server', () => {
                        server.sockWrite({ type: 'invalid' });
                    });
                    done.tap('umi-dev-server', (stats) => {
                        sendStats({
                            server,
                            sockets: server.sockets,
                            stats: getStats(stats),
                        });
                        _stats = stats;
                    });
                }
                if (compiler.compilers) {
                    compiler.compilers.forEach(addHooks);
                }
                else {
                    addHooks(compiler);
                }
            },
            onConnection: ({ connection, server }) => {
                if (_stats) {
                    sendStats({
                        server,
                        sockets: [connection],
                        stats: getStats(_stats),
                    });
                }
            },
        };
    }
}
Bundler.id = 'webpack';
Bundler.version = 4;
export { Bundler, BundlerConfigType, defaultWebpack as webpack };
