// TODO: Add RuntimeLogs plugin from api core

// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.json']

import path from 'path'
import fs from 'fs'
import { IRuntimeEnv } from './types'
const findenvs = require('find-up').sync(syncEnvs)

let runtimeEnv = <IRuntimeEnv>{}
const rootPackage = path.resolve(`${process.cwd()}/package.json`)

if(findenvs){
    try {
        // @ts-ignore
        runtimeEnv = JSON.parse(fs.readFileSync(findenvs))
    } catch (error) {
        console.log("Failed trying load runtime env")
        // (⓿_⓿) terrible...
    }
}else{
    console.log("Runtime env (.nodecore) is missing")
}

export const getDevRuntimeEnvs: any = () => {
    if (!runtimeEnv || typeof(runtimeEnv.devRuntime) == "undefined") {
        return false
    }

    return runtimeEnv.devRuntime
}

export const getGit = () => {
    const envs = getDevRuntimeEnvs()
    if (!envs || typeof(envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}