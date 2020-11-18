import Config from 'webpack-chain';
import { IConfig, IBundlerConfigType } from '@nodecorejs/types';
interface IOpts {
    type: IBundlerConfigType;
    webpackConfig: Config;
    config: IConfig;
    isDev: boolean;
    disableCompress?: boolean;
    browserslist?: any;
    miniCSSExtractPluginPath?: string;
    miniCSSExtractPluginLoaderPath?: string;
}
interface ICreateCSSRuleOpts extends IOpts {
    lang: string;
    test: RegExp;
    loader?: string;
    options?: object;
}
export declare function createCSSRule({ webpackConfig, type, config, lang, test, isDev, loader, options, browserslist, miniCSSExtractPluginLoaderPath, }: ICreateCSSRuleOpts): void;
export default function ({ type, config, webpackConfig, isDev, disableCompress, browserslist, miniCSSExtractPluginPath, miniCSSExtractPluginLoaderPath, }: IOpts): void;
export {};
