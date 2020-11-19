import { IConfig, IBundlerConfigType } from '@nodecorejs/types';
import defaultWebpack from 'webpack';
export interface IOpts {
    cwd: string;
    config: IConfig;
    type: IBundlerConfigType;
    env: 'development' | 'production';
    entry?: {
        [key: string]: string;
    };
    hot?: boolean;
    port?: number;
    babelOpts?: object;
    babelOptsForDep?: object;
    targets?: any;
    browserslist?: any;
    bundleImplementor?: typeof defaultWebpack;
    modifyBabelOpts?: (opts: object) => Promise<any>;
    modifyBabelPresetOpts?: (opts: object) => Promise<any>;
    chainWebpack?: (webpackConfig: any, args: any) => Promise<any>;
    miniCSSExtractPluginPath?: string;
    miniCSSExtractPluginLoaderPath?: string;
    __disableTerserForTest?: boolean;
}
export default function getConfig(opts: IOpts): Promise<defaultWebpack.Configuration>;
