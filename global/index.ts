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
        // (⓿_⓿) terrible...
    }
}

export const getDevRuntimeEnvs: any = () => {
    if (!runtimeEnv) {
        return false
    }

    if (typeof(runtimeEnv.devRuntime) !== "undefined") {
        return runtimeEnv.devRuntime
    }
    
    return false
}

export const getGit = () => {
    const envs = getDevRuntimeEnvs()
    if (!envs) {
        return false
    }
    
    if (typeof(envs.originGit) !== "undefined") {
        return envs.originGit
    }

    return false
}

getGit()