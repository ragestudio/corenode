const fallbackRemoteCoresSource = "https://nodecore.ragestudio.net/std/cores"

import Listr from 'listr'
import ora from 'ora'
import fs from 'fs'
import path from 'path'
import sevenBin from '7zip-bin'
import { extractFull } from 'node-7z'
import { performance } from 'perf_hooks'
import { Observable } from 'rxjs'
import execa from 'execa'

import { getRuntimeEnv } from '@nodecorejs/dot-runtime'
import { objectToArrayMap, verbosity } from '@nodecorejs/utils'
import logDump from '@nodecorejs/log'

import { asyncDoArray, downloadWithPipe, fetchRemotePkg } from '../utils'
import temporalDir from '../temporalDir'
import * as timing from '../performance'
import outputResume from '../outputResume'

const runtimeEnv = getRuntimeEnv()
const spinner = ora({ spinner: "dots", text: "Initalizing..." })
const remoteCoresSource = runtimeEnv.remoteCoreSource ?? fallbackRemoteCoresSource

function handleInstallCore(params) {
    return new Promise((resolve, reject) => {
        let pkgManifest = {}
        let installDir = runtimeEnv.src

        const { pkg, dir } = params

        timing.start(pkg)

        if (typeof (dir) !== "undefined") {
            installDir = dir
        }
        if (!installDir || !path.resolve(process.cwd(), installDir)) {
            console.log(`\n🆘 Invalid installation path!`)
            return console.error(`\t⁉️ Try to use [dir] argument or configure .nodecore runtime with and default "src" path.`)
        }

        let installPath = path.resolve(process.cwd(), `${installDir}`)
        let downloadPath = temporalDir.createNew(pkg)

        const tasks = new Listr([
            {
                title: '📡 Fetching package',
                task: () => fetchRemotePkg(remoteCoresSource, pkg, "lastest", (data) => {
                    data.extension = data.filename.split('.')[1]
                    data.address = `${remoteCoresSource}/pkgs/${data.id}/${data.filename}`
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
                        observer.next(`Processing paths`)

                        if (!fs.existsSync(installPath)) {
                            logDump(`Creating [installPath] "${installPath}"`)
                            fs.mkdir(installPath, { recursive: true }, e => {
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
                        const extractDirFile = path.resolve(downloadPath, `${pkgManifest[pkg].filename}`)

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
                //temporalDir.clean()
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