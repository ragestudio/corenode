export interface IRuntimeEnv {
    version: Number | String;
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