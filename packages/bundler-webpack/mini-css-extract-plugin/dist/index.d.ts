export var __esModule: boolean;
declare var _default: typeof MiniCssExtractPlugin;
export default _default;
declare class MiniCssExtractPlugin {
    constructor(options?: {});
    options: {
        filename: string;
        moduleFilename: () => string;
        ignoreOrder: boolean;
    };
    apply(compiler: any): void;
    getCssChunkObject(mainChunk: any): {};
    renderContentAsset(compilation: any, chunk: any, modules: any, requestShortener: any): any;
}
declare namespace MiniCssExtractPlugin {
    const loader: string;
}
