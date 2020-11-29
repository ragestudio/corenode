import Listr from 'listr'
import child_process from 'child_process'
import execa from 'execa'

import fs from 'fs'
import path from 'path'
import sevenBin from '7zip-bin'
import { extractFull } from 'node-7z'
import { performance } from 'perf_hooks'
import open from 'open'
import inquirer from 'inquirer'

import { __FetchPKGFromRemote, downloadWithPipe } from './utils/remotePkg'
import { asyncDoArray } from './utils/doArray'
import outputLog from './utils/outputLog'

const saveRuntimeFile = ".nodecore"
const fallbackRemoteSource = "https://api.ragestudio.net/std/nodecore_cores"

let pkgManifest = {}
let perfs = []

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
let { Observable } = require('rxjs')

import { getRuntimeEnv, getRootPackage } from '@nodecorejs/dot-runtime'

let nodecore_rc = getRuntimeEnv()
let processExitQueue = []

// const exitQueue = {
//     set: (exec) => {
//         outputLog.setCache(`[exitQueue] added > ${exec} < to processExitQueue`)
//         processExitQueue.push(exec)
//     },
//     remove: () => {

//     }
// }

yargs(hideBin(process.argv))    // process.argv.slice(2)
    .option('clear', {
        default: true,
        describe: 'Clear before print console',
        type: 'boolean'
    })
    .command(
        ['add [pkg]', 'a [pkg]'],
        'Install an core package from nodecore library',
        {},
        (argv) => {
            if (typeof (argv.pkg) !== "undefined") {
                if (argv.clear) {
                    console.clear()
                }
                __requiredRuntime()
                __installCore({ pkg: argv.pkg })
                    .then(() => {
                        checkProcessComponents(pkgManifest[argv.pkg]).catch((err) => {
                            console.error(err)
                            return process.exit(1)
                        })
                    })
                    .catch((err) => {
                        console.error(err)
                        return process.exit(1)
                    })
            }
        }
    )
    .command(
        ['install [pkg]', 'i [pkg]'],
        'Install an dependency from npm',
        {},
        (argv) => {
            if (typeof (argv.pkg) !== "undefined") {
                __requiredRuntime()
                __installPackage({ pkg: `@ragestudio/nodecore-${argv.pkg}` })
            }
        }
    )
    .command(
        ['logs'],
        'Open nodecore-cli output logs',
        {},
        () => {
            open(`${outputlogs}`)
                .then(() => {
                    console.log('✅ Opened on your default editor...')
                })
                .catch(() => {
                    console.log('✖ Cannot open output logs...')
                })
        }
    )
    .command(
        ['init'],
        'Init .nodecore runtime in your current proyect',
        {},
        () => {
            __initCreateRuntime()
        }
    )
    .help()
    .argv

function __requiredRuntime() {
    if (!nodecore_rc) {
        outputLog.spinner.fail(`".nodecore" is not present`)
        return process.exit(1)
    }
    if (!nodecore_rc.src) {
        outputLog.spinner.fail(`(src) is not defined on ".nodecore" file`)
        return process.exit(1)
    }
    if (nodecore_rc.remoteSource) {
        return outputLog.spinner.warn(`remoteSource is not provided! Using fallback`)
    }
}

function __initCreateRuntime() {
    if (nodecore_rc) {
        console.log(`⚠ It seems this project has already been initialized previously, the parameters you enter will be replaced...`)
    }

    const prompts = [
        {
            name: "src",
            type: "input",
            message: "Source directory path (Relative) >",
            default: nodecore_rc.src ?? "/src"
        },
        {
            name: "add_basicframework",
            message: "Install basic framework >",
            type: "confirm"
        },
        {
            name: "init_npm",
            message: "You want to iniatilize npm proyect now >",
            type: "confirm"
        }
    ]

    inquirer.prompt(prompts)
        .then(answers => {
            if (!answers.src) {
                // missing source directory path, re-enter try
                return false
            }
            const nodecoreRuntimeString = {
                src: answers.src
            }

            fs.writeFile(saveRuntimeFile ?? '.nodecore', JSON.stringify(nodecoreRuntimeString, null, "\t"), function (err) {
                if (err) throw err;
                console.log('✳ Saved runtime file! >', saveRuntimeFile ?? '.nodecore');
            });

            if (answers.init_npm) {
                execa('npm', ['init']).stdout.pipe(process.stdout)
            }
        })
        .catch(error => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                // Something else when wrong
            }
        });
}

async function __installPackage(params, caller) {
    // to do: check version & auto update if not match
    // to do: add support for version selection
    return new Promise((resolve, reject) => {
        const localpackage = getRootPackage()
        if (typeof (localpackage.dependencies) !== "undefined") {
            if (localpackage.dependencies[`${params.pkg}`]) {
                outputLog.setCache(`${params.pkg} is already installed > ${localpackage.dependencies[`${params.pkg}`]}`)
                return resolve(true)
            }
        }

        outputLog.setCache(`Installing from npm > ${params.pkg} < Requested by (${caller})`)

        const npmi = child_process.exec(`npm install --quiet --no-progress --silent ${params.pkg}`, {}, (error, stdout, stderr) => {
            if (stdout) {
                outputLog.setCache(stdout)
            }
            if (error) {
                outputLog.setCache(error)
                return reject(error)
            }
        })

        npmi.on('exit', code => {
            outputLog.setCache(`npm installer exit with ${code}`)
            return resolve(code)
        })
    })
}

async function checkProcessComponents(manifest) {
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

function outputResume(payload) {
    const { installPath, downloadPath, filename, pkg } = payload
    console.group()
    console.log(`\n📦 Installed package (${pkg}) on > ${installPath}`)
    console.log(`⏱ Operation tooks ${(performance.now() - perfs[pkg]).toFixed(2)}ms \n`)
    console.groupEnd()
}

function __installCore(params) {
    return new Promise((resolve, reject) => {
        const { pkg } = params

        perfs[pkg] = performance.now()
        const remoteSource = nodecore_rc.remoteSource ?? fallbackRemoteSource

        let installPath = path.resolve(`${process.cwd()}/${nodecore_rc.src}/${pkg}`)
        let tmpPath = path.resolve(`${__dirname}/dltmp`)
        let downloadPath = path.resolve(`${tmpPath}/${pkg}_${new Date().getTime()}`)

        const tasks = new Listr([
            {
                title: '📡 Fetching package',
                task: () => __FetchPKGFromRemote(remoteSource, pkg, "lastest", data => {
                    data.extension = data.filename.split('.')[1]
                    data.address = `${remoteSource}/pkgs/${data.id}/${data.filename}`
                    if (data.scopeDir) {
                        installPath = path.resolve(`${process.cwd()}/${nodecore_rc.src}/${data.scopeDir}`)
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
                                    return observer.complete(res)
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

                return resolve()
            })
            .catch((err) => {
                outputLog.setCache(`error cathed on ${pkg} installation > ${err}`)
                outputLog.spinner.fail(`Error installing pkg (${pkg}) > ${err}`)
                return reject(err)
            })
    })
}


async function doExitQueue(params) {
    return new Promise((resolve, reject) => {
        if (Array.isArray(processExitQueue)) {
            processExitQueue.forEach((e) => {
                outputLog.setCache(`executing > ${e} < as element of queue`)
                try {
                    if (typeof (e) == "function") {
                        return e()
                    }
                    return false
                } catch (error) {
                    return reject(console.error(error))
                }
            })
            return resolve(true)
        }
    })
}

process.on('exit', async () => {
    process.stdin.resume()
    doExitQueue()
        .then(() => {
            outputLog.setCache(`Exiting after queue`)
            return process.exit(0)
        })
        .catch((err) => {
            console.error(err)
            outputLog.setCache(err)
            return process.exit(1)
        })
})
