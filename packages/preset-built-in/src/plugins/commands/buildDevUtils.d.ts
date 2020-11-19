/// <reference types="webpack" />
import { IApi } from '@nodecorejs/types';
import { Bundler as DefaultBundler, webpack } from '@nodecorejs/bundler-webpack';
export declare function getBundleAndConfigs({ api, port, }: {
    api: IApi;
    port?: number;
}): Promise<{
    bundleImplementor: any;
    bundler: DefaultBundler;
    bundleConfigs: any;
}>;
export declare function cleanTmpPathExceptCache({ absTmpPath, }: {
    absTmpPath: string;
}): void;
export declare function printFileSizes(stats: webpack.Stats, dir: string): void;
