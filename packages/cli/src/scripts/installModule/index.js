const fallbackRemoteModulesSource = "https://nodecore.ragestudio.net/std/modules"

import Listr from 'listr'
import fs from 'fs'
import path from 'path'
import { Observable } from 'rxjs'
import fetch from 'node-fetch'

import { initRegistry, writeModule, writeModuleRegistry } from '@nodecorejs/modules'
import { getRuntimeEnv } from '@nodecorejs/dot-runtime'
import { objectToArrayMap, verbosity } from '@nodecorejs/utils'
import logDump from '@nodecorejs/log'

import temporalDir from '../temporalDir'
import outputResume from '../outputResume'
import * as timing from '../performance'
import { downloadWithPipe } from '../utils'

const runtimeEnv = getRuntimeEnv()
const remoteModulesSource = runtimeEnv.remoteModulesSource ?? fallbackRemoteModulesSource

export async function installModule(params) {
    const { pkg, dir, version = "lastest" } = params

    if (!pkg) {
        return console.error(`🚫 Nothing to install!`)
    }

    timing.start(pkg)

    const downloadPath = temporalDir.createNew(pkg)

    const moduleFilename = `${pkg}.module`
    const moduleFile = path.resolve(downloadPath, moduleFilename)
    const moduleURI = `${remoteModulesSource}/${pkg}/${version}/index.module`

    let moduleCodec = "utf-8" // TODO: Fetch codec info from manifest

    let tasks = [
        {
            title: '📡 Checking remote',
            task: () => {
                return new Promise((resolve, reject) => {
                    fetch(moduleURI).then(done => {
                        resolve(true)
                    }).catch((err) => {
                        reject(err.message)
                    })
                })
            }
        },
        {
            title: '🚚 Fetching module',
            task: () => {
                return new Promise((resolve, reject) => {
                    downloadWithPipe(moduleURI, moduleFilename, downloadPath).then(done => {
                        return resolve()
                    }).catch((err) => {
                        return reject(err.message)
                    })
                })
            }
        },
        {
            title: '🔩 Processing module',
            task: () => {
                return new Promise((resolve, reject) => {
                    const _module = require(moduleFile)
                    if (typeof (_module.node_modules)) {

                    }
                    if (typeof (_module.lib)) {

                    }

                    writeModule(_module.pkg, null, fs.readFileSync(moduleFile, moduleCodec)).then(done => {
                        initRegistry(true)
                        resolve()
                    }).catch((err) => {
                        reject(err)
                    })
                })
            }
        },
    ]

    const list = new Listr(tasks, {
        collapse: false
    })
    list.run()
        .then((res) => {
            temporalDir.clean()
            outputResume({ downloadPath, pkg })
        })
        .catch((err) => {
            const errStr = `Failed installation Task >`

            verbosity.error(errStr, err.message)
            logDump(errStr, err)
        })
}

export default installModule