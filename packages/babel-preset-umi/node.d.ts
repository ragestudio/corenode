declare function _exports(api: any, opts: any): {
    presets: (((context: any, opts?: import("./lib").IOpts | undefined) => any) | {
        typescript: boolean;
        react: boolean;
        env: {
            targets: {
                node: string;
            };
            modules: string;
        };
    })[][];
};
export = _exports;
