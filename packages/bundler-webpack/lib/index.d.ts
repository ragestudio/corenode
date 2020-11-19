import { IConfig, BundlerConfigType } from '@nodecorejs/types';
import defaultWebpack from 'webpack';
import { IServerOpts } from '@nodecorejs/server';
import { IOpts as IGetConfigOpts } from './getConfig/getConfig';
interface IOpts {
    cwd: string;
    config: IConfig;
}
declare class Bundler {
    static id: string;
    static version: number;
    cwd: string;
    config: IConfig;
    constructor({ cwd, config }: IOpts);
    getConfig(opts: Omit<IGetConfigOpts, 'cwd' | 'config'>): Promise<defaultWebpack.Configuration>;
    build({ bundleConfigs, bundleImplementor, }: {
        bundleConfigs: defaultWebpack.Configuration[];
        bundleImplementor?: typeof defaultWebpack;
    }): Promise<{
        stats: defaultWebpack.Stats;
    }>;
    /**
     * get ignored watch dirs regexp, for test case
     */
    getIgnoredWatchRegExp: () => defaultWebpack.Options.WatchOptions['ignored'];
    setupDevServerOpts({ bundleConfigs, bundleImplementor, }: {
        bundleConfigs: defaultWebpack.Configuration[];
        bundleImplementor?: typeof defaultWebpack;
    }): IServerOpts;
}
export { Bundler, BundlerConfigType, defaultWebpack as webpack };
