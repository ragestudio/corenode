export declare const getDevRuntimeEnv: any;
export declare const getGit: () => any;

export interface IRuntimeEnv {
    parsedVersion: Object;
    runtimeEnv: Object; 
    devRuntime: Object;
    originGit: Object;
    major: Number;
    minor: Number;
    patch: Number;
}

export interface IPackageJSON {
    version: String;
}