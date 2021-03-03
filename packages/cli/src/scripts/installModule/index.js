const fallbackRemoteModulesSource = "https://nodecore.ragestudio.net/std/modules"

import Listr from 'listr'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

import { loadRegistry, writeModule } from '@nodecorejs/modules'
import { getProyectEnv, isDependencyInstalled, addDependency } from '@nodecorejs/dot-runtime'
import { verbosity, objectToArrayMap } from '@nodecorejs/utils'

import temporalDir from '../temporalDir'
import outputResume from '../outputResume'
import * as timing from '../performance'
import installCore from '../installCore'
import { downloadWithPipe } from '../utils'

const runtimeEnv = getProyectEnv()
const remoteModulesSource = runtimeEnv.remoteModulesSource ?? fallbackRemoteModulesSource

export function installModule(params) {
    const { pkg, version = "lastest" } = params

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
                verbosity.dump("checking remote")
                return new Promise((resolve, reject) => {
                    fetch(moduleURI).then(done => {
                        return resolve(true)
                    }).catch((err) => {
                        verbosity.options({ dumpFile: 'only' }).error(err)
                        return reject(err.message)
                    })
                })
            }
        },
        {
            title: '🚚 Fetching module',
            task: () => {
                // TODO: 404 handle & uri pre check status
                verbosity.dump("Fetching module")
                return new Promise((resolve, reject) => {
                    downloadWithPipe(moduleURI, moduleFilename, downloadPath).then(done => {
                        return resolve()
                    }).catch((err) => {
                        verbosity.options({ dumpFile: 'only' }).error(err)
                        return reject(`Failed downloading module`)
                    })
                })
            }
        },
        {
            title: '🔩 Processing module',
            task: () => {
                verbosity.dump("Processing module")
                return new Promise((resolve, reject) => {
                    const _module = require(moduleFile)
                    writeModule(_module.pkg, null, fs.readFileSync(moduleFile, moduleCodec)).then(async (modulePath) => {
                        if (_module.requireCore) {
                            try {
                                await installCore({ pkg: _module.requireCore, dir: modulePath })
                            } catch (error) {
                                verbosity.options({ dumpFile: true }).error(`Error installing required core >`, error.message)
                            }
                        }

                        if (_module.runtimeTemplate) {
                            const templateFile = path.resolve(modulePath, `.template.nodecore`)
                            try {
                                if (fs.existsSync(templateFile)) {
                                    //const template = fs.readFileSync(templateFile, moduleCodec)
                                    // TODO: Apply template to .nodecore
                                }
                            } catch (error) {
                                verbosity.options({ dumpFile: true }).error(`Error processing runtime template >`, error)
                            }
                        }

                        if (_module.node_modules) {
                            if (Boolean(params?.ignoreDeps)) {
                                verbosity.options({ dumpFile: true }).warn(`Ignoring dependencies installation`)
                            } else {
                                objectToArrayMap(_module.node_modules).forEach((dep) => {
                                    const isInstalled = isDependencyInstalled(dep.key) ? true : false
                                    if (!isInstalled) {
                                        addDependency(dep, true)
                                    }
                                })
                            }
                        }

                        loadRegistry({ write: true })
                        resolve()
                    }).catch((err) => {
                        reject(err)
                    })
                })
            }
        },
    ]

    new Listr(tasks, { collapse: false, concurrent: false }).run().then((res) => {
        params?.keepTmp ? null : temporalDir.clean()
        outputResume({ downloadPath, pkg })
    })
        .catch((err) => {
            verbosity.options({ dumpFile: true }).error(`Failed installation Task >`, err)
        })
}

export default installModule