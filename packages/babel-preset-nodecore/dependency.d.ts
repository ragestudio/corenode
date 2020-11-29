declare function _exports(api: any, opts: any): {
    presets: (((context: any, opts?: import("./dist").IOpts | undefined) => any) | {
        env: {
            useBuiltIns: string;
            corejs: number;
            modules: boolean;
        };
        transformRuntime: {};
    })[][];
};
export = _exports;
