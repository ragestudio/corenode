const fallbackRemoteModulesSource = "https://nodecore.ragestudio.net/std/modules"

import Listr from 'listr'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

import { initRegistry, writeModule } from '@nodecorejs/modules'
import { getRuntimeEnv } from '@nodecorejs/dot-runtime'
import { verbosity } from '@nodecorejs/utils'
import logDump from '@nodecorejs/log'

import temporalDir from '../temporalDir'
import outputResume from '../outputResume'
import * as timing from '../performance'
import installCore from '../installCore'
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
                // TODO: 404 handle & uri pre check status
                return new Promise((resolve, reject) => {
                    downloadWithPipe(moduleURI, moduleFilename, downloadPath).then(done => {
                        return resolve()
                    }).catch((err) => {
                        return reject(`Failed downloading module`)
                    })
                })
            }
        },
        {
            title: '🔩 Processing module',
            task: () => {
                return new Promise((resolve, reject) => {
                    const _module = require(moduleFile)

                    writeModule(_module.pkg, null, fs.readFileSync(moduleFile, moduleCodec)).then(async (modulePath) => {
                        if (_module.requireCore) {
                            try {
                                await installCore({pkg: _module.requireCore, dir: modulePath})
                                logDump(`Installed core!!`)
                            } catch (error) {
                                verbosity.error(`Error installing required core >`, error.message)
                            }
                        }
                   
                        if (_module.runtimeTemplate) {
                            const templateFile = path.resolve(modulePath, `.template.nodecore`)
                            try {
                                if (fs.existsSync(templateFile)) {
                                    const template = fs.readFileSync(templateFile, moduleCodec)
                                    
                                }
                            } catch (error) {
                                const errStr = `Error processing runtime template >`
                                verbosity.error(errStr)
                                logDump(errStr, error)
                            }
                        }
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
            //temporalDir.clean()
            outputResume({ downloadPath, pkg })
        })
        .catch((err) => {
            const errStr = `Failed installation Task >`

            verbosity.error(errStr, err)
            logDump(errStr, err)
        })
}

export default installModule