// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.json'];
import findup from 'find-up';
import path from 'path';
import fs from 'fs';
// @ts-ignore
let runtimeEnv = JSON.parse(fs.readFileSync(findup.sync(syncEnvs)));
const rootPackage = path.resolve(`${process.cwd()}/package.json`);
export const getDevRuntimeEnvs = () => {
    if (!runtimeEnv) {
        return false;
    }
    if (typeof (runtimeEnv.devRuntime) !== "undefined") {
        return runtimeEnv.devRuntime;
    }
    return false;
};
export const getGit = () => {
    const envs = getDevRuntimeEnvs();
    if (!envs) {
        return false;
    }
    if (typeof (envs.originGit) !== "undefined") {
        return envs.originGit;
    }
    return false;
};
getGit();
