// set this origin by default as an legacy fallback
const fallbackRemoteCoresSource = "https://api.ragestudio.net/std/nodecore_cores"
const fallbackRemoteModulesSource = "https://nodecore.ragestudio.net/std/modules"

import Listr from 'listr'
import ora from 'ora'
import fs from 'fs'
import path, { resolve } from 'path'
import sevenBin from '7zip-bin'
import { extractFull } from 'node-7z'
import { performance } from 'perf_hooks'
import { Observable } from 'rxjs'
import execa from 'execa'

import { asyncDoArray, downloadWithPipe, fetchRemotePkg } from '../utils'
import fetch from 'node-fetch'

import { getRuntimeEnv } from '@nodecorejs/dot-runtime'
import { objectToArrayMap, verbosity } from '@nodecorejs/utils'
import logDump from '@nodecorejs/log'

import { initRegistry, writeModule, writeModuleRegistry } from '@nodecorejs/modules'

let performace = []
const runtimeEnv = getRuntimeEnv()

function outputResume(payload) {
    const { installPath, pkg } = payload || null
    console.group()
    console.log(`\n📦  Installed package (${pkg}) ${installPath ? `on > ${installPath}` : ""}`)
    performace[pkg] ? console.log(`⏱  Operation tooks ${(performance.now() - performace[pkg]).toFixed(2)}ms \n`) : null
    console.groupEnd()
}

const spinner = ora({
    spinner: "dots",
    text: "Initalizing..."
})

const remoteCoresSource = runtimeEnv.remoteCoreSource ?? fallbackRemoteCoresSource
const remoteModulesSource = runtimeEnv.remoteModulesSource ?? fallbackRemoteModulesSource
const temporalPath = path.resolve(`${__dirname}/.nodecore_tmp`)

function cleanTemporal(params) {
    spinner.start("Cleaning up temporal files...")
    fs.rmdirSync(temporalPath, { recursive: true })
    spinner.succeed()
}

export async function installModule(params) {
    const { pkg, dir, version = "lastest" } = params
    if (!pkg) {
        return console.error(`🚫 Nothing to install!`)
    }
    const installPath = dir
    const downloadPath = path.resolve(`${temporalPath}/${pkg}_${new Date().getTime()}`)

    const moduleFilename = `${pkg}.module`
    const moduleFile = path.resolve(downloadPath, moduleFilename)
    const moduleURI = `${remoteModulesSource}/${pkg}/${version}/index.module`

    let moduleCodec = "utf-8" // TODO: Fetch codec info from manifest

    performace[pkg] = performance.now()

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
            title: '🧱 Processing directory',
            task: () => {
                return new Observable(observer => {
                    if (!fs.existsSync(installPath)) {
                        observer.next(`Creating installation paths`)

                        logDump(`Creating [installPath] "${installPath}"`)
                        fs.mkdir(installPath, { recursive: true }, e => {
                            if (e) return rej(console.error(e))
                        })
                    }

                    if (!fs.existsSync(downloadPath)) {
                        observer.next(`Creating download paths`)

                        logDump(`Creating [downloadPath] "${downloadPath}"`)
                        fs.mkdir(downloadPath, { recursive: true }, e => {
                            if (e) return rej(console.error(e))
                        })
                    }
                    observer.complete()
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
            cleanTemporal()
            outputResume({ downloadPath, pkg })
        })
        .catch((err) => {
            const errStr = `Failed installation Task >`

            verbosity.error(errStr, err.message)
            logDump(errStr, err)
        })
}

function handleInstallCore(params) {
    return new Promise((resolve, reject) => {
        let pkgManifest = {}
        let installDir = runtimeEnv.src

        const { pkg, dir } = params
        if (typeof (dir) !== "undefined") {
            installDir = dir
        }

        if (!installDir || !path.resolve(process.cwd(), installDir)) {
            console.log(`\n🆘 Invalid installation path!`)
            return console.error(`\t⁉️ Try to use [dir] argument or configure .nodecore runtime with and default "src" path.`)
        }

        performace[pkg] = performance.now()
        const remoteSource = runtimeEnv.remoteSource ?? fallbackRemoteCoresSource

        let installPath = path.resolve(`${process.cwd()}/${installDir}/${pkg}`)
        let downloadPath = path.resolve(`${temporalPath}/${pkg}_${new Date().getTime()}`)

        const tasks = new Listr([
            {
                title: '📡 Fetching package',
                task: () => fetchRemotePkg(remoteSource, pkg, "lastest", (data) => {
                    data.extension = data.filename.split('.')[1]
                    data.address = `${remoteSource}/pkgs/${data.id}/${data.filename}`
                    if (data.scopeDir) {
                        installPath = path.resolve(`${process.cwd()}/${runtimeEnv.src}/${data.scopeDir}`)
                    }
                    pkgManifest[pkg] = data
                })
            },
            {
                title: '🔩 Processing Dependencies',
                task: () => {
                    return new Observable(async (observer) => {
                        const requires = pkgManifest[pkg].require
                        if (!requires) {
                            logDump(`No require on pkg [${pkgManifest[pkg].id}] > ${requires}`)
                            return observer.complete()
                        }

                        if (typeof (requires.npm) !== "undefined") {
                            observer.next('Installing npm dependencies')
                            objectToArrayMap(requires.npm).forEach(dependency => {
                                cliArgs.push(`${dependency.key}`) // TODO: Parse version
                            })
                            const { stdout } = execa.sync('npm', ['install'], {
                                cwd: process.cwd(),
                            })
                            console.log(stdout)
                            observer.complete()
                        }

                    })
                }
            },
            {
                title: '🧱 Processing directory',
                task: () => {
                    return new Observable(observer => {
                        observer.next(`Creating paths`)

                        if (!fs.existsSync(installPath)) {
                            logDump(`Creating [installPath] "${installPath}"`)
                            fs.mkdir(installPath, { recursive: true }, e => {
                                if (e) return rej(console.error(e))
                            })
                        }

                        if (!fs.existsSync(downloadPath)) {
                            logDump(`Creating [downloadPath] "${downloadPath}"`)
                            fs.mkdir(downloadPath, { recursive: true }, e => {
                                if (e) return rej(console.error(e))
                            })
                        }
                        observer.complete()
                    })
                }
            },
            {
                title: '🌐 Downloading package',
                task: () => downloadWithPipe(pkgManifest[pkg].address, pkgManifest[pkg].filename, downloadPath)
            },
            {
                title: "🚧 Installing package",
                task: () => {
                    return new Observable(observer => {
                        const extractDirFile = path.resolve(`${downloadPath}/${pkgManifest[pkg].filename}`)

                        if (fs.existsSync(extractDirFile)) {
                            let fileCount = 0
                            const perf_extract0 = performance.now()
                            const unpackStream = extractFull(extractDirFile, path.resolve(`${installPath}/`), {
                                $bin: sevenBin.path7za,
                                $progress: true,
                                recursive: true
                            })

                            unpackStream.on('progress', (progress) => {
                                fileCount = progress.fileCount
                                let printStr = `Extracting ${progress.filename ?? 'file ...'}`

                                observer.next(printStr)
                                logDump(printStr)
                            })

                            unpackStream.on('end', () => {
                                const perf_extract1 = performance.now()
                                setTimeout(() => {
                                    logDump(`Extracted ${fileCount} files in ${(perf_extract1 - perf_extract0).toFixed(2)} ms`)
                                    return observer.complete()
                                }, 300)
                            })

                            unpackStream.on('error', (err) => {
                                logDump(err)
                                return observer.error(err)
                            })

                        } else {
                            const err = `File is not available. Failed download?`
                            logDump(err)
                            return observer.error(err)
                        }
                    })
                }
            }
        ], {
            collapse: false
        })
        tasks.run()
            .then((res) => {
                cleanTemporal()
                outputResume({ installPath, downloadPath, filename: pkgManifest[pkg].filename, pkg })

                return resolve(pkgManifest[pkg])
            })
            .catch((err) => {
                logDump(`error cathed on ${pkg} installation > ${err}`)
                spinner.fail(`Error installing pkg (${pkg}) > ${err}`)
                return reject(err)
            })
    })
}

async function handleInstallPackageComponents(manifest) {
    return new Promise((res, rej) => {
        const requires = manifest.require

        if (!requires) {
            logDump(`No required components [${manifest.id}]`)
            return res()
        }

        if (requires.components) {
            asyncDoArray(requires.components, (key, value) => { //lgtm [js/call-to-non-callable]
                logDump(`[nodecore] Installing > ${key} < as dependecy of ${manifest.id ?? "anon"}`)
                installCore({ pkg: key })
            })
                .then(() => {
                    return res()
                })
                .catch((err) => {
                    logDump(err)
                    return rej(err)
                })
        }
    })
}

export async function installCore(params) {
    handleInstallCore(params).then((res) => {
        handleInstallPackageComponents(res).catch((err) => {
            console.error(err)
            return process.exit(1)
        })
    })
}

export default installCore