declare function _exports(context: any, opts: any): {
    presets: (((context: any, opts?: import("./lib").IOpts | undefined) => any) | {
        typescript: boolean;
        env: {
            useBuiltIns: string;
            corejs: number;
            modules: boolean;
        };
        react: {
            development: boolean;
        };
        transformRuntime: {};
        reactRemovePropTypes: boolean;
        reactRequire: boolean;
        lockCoreJS3: {};
    })[][];
};
export = _exports;
