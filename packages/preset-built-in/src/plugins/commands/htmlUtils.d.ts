import { IApi, IRoute, webpack } from '@nodecorejs/types';
export declare function chunksToFiles(opts: {
    htmlChunks: (string | object)[];
    chunks?: webpack.compilation.Chunk[];
    noChunk?: boolean;
}): {
    cssFiles: string[];
    jsFiles: string[];
    headJSFiles: string[];
};
export declare function getHtmlGenerator({ api }: {
    api: IApi;
}): any;
/**
 * flatten routes using routes config
 * @param opts
 */
export declare function getFlatRoutes(opts: {
    routes: IRoute[];
}): IRoute[];
