// set this origin by default as an legacy fallback
const fallbackRemoteSource = "https://api.ragestudio.net/std/nodecore_cores"

import Listr from 'listr'
import ora from 'ora'
import fs from 'fs'
import path from 'path'
import sevenBin from '7zip-bin'
import { extractFull } from 'node-7z'
import { performance } from 'perf_hooks'
import { Observable } from 'rxjs'

import { __installPackage } from '../__installPackage'

import { asyncDoArray, downloadWithPipe, __FetchPKGFromRemote } from '../utils'

import { getRuntimeEnv } from '@nodecorejs/dot-runtime'
import { objectToArrayMap } from '@nodecorejs/utils'
import logDump from '@nodecorejs/log' 

import execa from 'execa'

let performace = []
const runtimeEnv = getRuntimeEnv()

function outputResume(payload) {
    const { installPath, pkg } = payload
    console.group()
    console.log(`\n📦 Installed package (${pkg}) on > ${installPath}`)
    console.log(`⏱ Operation tooks ${(performance.now() - performace[pkg]).toFixed(2)}ms \n`)
    console.groupEnd()
}

const spinner = ora({
    spinner: "dots",
    text: "Initalizing..."
})

function handleInstall(params) {
    return new Promise((resolve, reject) => {
        let pkgManifest = {}
        let installDir = runtimeEnv.src

        const { pkg, dir } = params
        if (typeof(dir) !== "undefined") {
            installDir = dir    
        }

        if (!installDir || !path.resolve(process.cwd(), installDir)) {
            console.log(`\n🆘 Invalid installation path!`)
            return console.error(`\t⁉️ Try to use [dir] argument or configure .nodecore runtime with and default "src" path.`)
        }

        performace[pkg] = performance.now()
        const remoteSource = runtimeEnv.remoteSource ?? fallbackRemoteSource

        let installPath = path.resolve(`${process.cwd()}/${installDir}/${pkg}`)
        let tmpPath = path.resolve(`${__dirname}/dltmp`)
        let downloadPath = path.resolve(`${tmpPath}/${pkg}_${new Date().getTime()}`)

        const tasks = new Listr([
            {
                title: '📡 Fetching package',
                task: () => __FetchPKGFromRemote(remoteSource, pkg, "lastest", (data) => {
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
                            let cliArgs = ['install']
                            objectToArrayMap(requires.npm).forEach(dependency => {
                                cliArgs.push(`${dependency.key}`) // TODO: Parse version
                            })
                            const { stdout } = execa.sync('npm', cliArgs, {
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
                spinner.start("Cleaning up temporal files...")
                fs.rmdirSync(tmpPath, { recursive: true })
                spinner.succeed()

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
                __installCore({ pkg: key })
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

export async function __installCore(params) {
    handleInstall(params)
    .then((res) => {
        handleInstallPackageComponents(res).catch((err) => {
            console.error(err)
            return process.exit(1)
        })
    })
}