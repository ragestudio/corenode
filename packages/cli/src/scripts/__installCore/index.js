// set this origin by default as an legacy fallback
const fallbackRemoteSource = "https://api.ragestudio.net/std/nodecore_cores"

import Listr from 'listr'
import fs from 'fs'
import path from 'path'
import sevenBin from '7zip-bin'
import { extractFull } from 'node-7z'
import { performance } from 'perf_hooks'
import { Observable } from 'rxjs'
import { __installPackage } from '../__installPackage'

import { __FetchPKGFromRemote, downloadWithPipe } from '../utils/remotePkg'
import { asyncDoArray } from '../utils/doArray'
import outputLog from '../utils/outputLog'

import { getRuntimeEnv } from '@nodecorejs/dot-runtime'

let performace = []
const runtimeEnv = getRuntimeEnv()


function outputResume(payload) {
    const { installPath, pkg } = payload
    console.group()
    console.log(`\n📦 Installed package (${pkg}) on > ${installPath}`)
    console.log(`⏱ Operation tooks ${(performance.now() - performace[pkg]).toFixed(2)}ms \n`)
    console.groupEnd()
}

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
                            outputLog.setCache(`No require on pkg [${pkgManifest[pkg].id}] > ${requires}`)
                            return observer.complete()
                        }

                        if (typeof (requires.npm) !== "undefined") {
                            observer.next('Installing npm dependencies')
                            await asyncDoArray(requires.npm, async (key, value) => {
                                return new Promise((res, rej) => {
                                    observer.next(`[npm] Installing > ${key}`)
                                    __installPackage({ pkg: key }, pkgManifest[pkg].id)
                                        .then((data) => {
                                            outputLog.setCache(`[npm] installed ${key}`)
                                            return res(data)
                                        })
                                        .catch((err) => {
                                            return rej(err)
                                        })
                                })
                            }, (err, res) => {
                                if (err) {
                                    return observer.error(err)
                                }
                                if (res) {
                                    return observer.complete()
                                }
                            })
                        }

                    })
                }
            },
            {
                title: '🧱 Processing directory',
                task: () => {
                    return new Observable(observer => {
                        observer.next(`Creating paths`);

                        if (!fs.existsSync(installPath)) {
                            outputLog.setCache(`Creating [installPath] "${installPath}"`);
                            fs.mkdir(installPath, { recursive: true }, e => {
                                if (e) return rej(console.error(e))
                            })
                        }

                        if (!fs.existsSync(downloadPath)) {
                            outputLog.setCache(`Creating [downloadPath] "${downloadPath}"`);
                            fs.mkdir(downloadPath, { recursive: true }, e => {
                                if (e) return rej(console.error(e))
                            })
                        }
                        observer.complete();
                    });
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
                                outputLog.setCache(printStr)
                            })

                            unpackStream.on('end', () => {
                                const perf_extract1 = performance.now()
                                setTimeout(() => {
                                    outputLog.setCache(`Extracted ${fileCount} files in ${(perf_extract1 - perf_extract0).toFixed(2)} ms`)
                                    return observer.complete()
                                }, 300)
                            })

                            unpackStream.on('error', (err) => {
                                outputLog.setCache(err)
                                return observer.error(err)
                            })

                        } else {
                            const err = `File is not available. Failed download?`
                            outputLog.setCache(err)
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
                outputLog.text("Cleaning up temporal files...")
                fs.rmdirSync(tmpPath, { recursive: true })
                outputLog.spinner.succeed()

                outputResume({ installPath, downloadPath, filename: pkgManifest[pkg].filename, pkg })

                return resolve(pkgManifest[pkg])
            })
            .catch((err) => {
                outputLog.setCache(`error cathed on ${pkg} installation > ${err}`)
                outputLog.spinner.fail(`Error installing pkg (${pkg}) > ${err}`)
                return reject(err)
            })
    })
}

async function handleInstallPackageComponents(manifest) {
    return new Promise((res, rej) => {
        const requires = manifest.require

        if (!requires) {
            outputLog.setCache(`No required components [${manifest.id}]`)
            return res()
        }

        if (requires.components) {
            asyncDoArray(requires.components, (key, value) => {
                outputLog.setCache(`[nodecore] Installing > ${key} < as dependecy of ${manifest.id ?? "anon"}`)
                __installCore({ pkg: key })
            })
                .then(() => {
                    return res()
                })
                .catch((err) => {
                    outputLog.setCache(err)
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