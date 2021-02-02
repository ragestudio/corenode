import path from 'path'
import open from 'open'
import Listr from 'listr'
import execa from 'execa'
import process from 'process'

import newGithubReleaseUrl from 'new-github-release-url'
import { Observable } from 'rxjs'

import { getPackages, getGit, bumpVersion, syncAllPackagesVersions, getVersion, isProyectMode } from '@nodecorejs/dot-runtime'
let { verbosity, objectToArrayMap } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: "[PUBLISH]" })

import { getChangelogs } from '../utils/getChangelogs'
import buildProyect from '@nodecorejs/builder'

export function publishProyect(args) {
    return new Promise((resolve, reject) => {
        let proyectPackages = getPackages()
        // let beforeVersion = getVersion()

        const proyectGit = getGit()
        const isProyect = isProyectMode()

        let config = {
            skipStatus: false,
            skipBuild: false,
            skipSyncVersion: false,
            npm: false,
            github: false,
            preRelease: false,
            next: false,
            minor: false,
            nodecoreModule: false,
        }

        if (typeof (args) !== "undefined") {
            config = { ...config, ...args }
        }

        let publishTasks = [
            {
                title: "📢  Publish on NPM",
                enabled: () => config.npm === true,
                task: () => {
                    return new Observable((observer) => {
                        if (!Array.isArray(proyectPackages) && !isProyect) {
                            proyectPackages = ["_Proyect"]
                        }

                        proyectPackages.forEach((pkg, index) => {
                            const packagePath = isProyect ? path.resolve(process.cwd(), `packages/${pkg}`) : process.cwd()
                            const { name } = require(path.join(packagePath, 'package.json'))

                            const cliArgs = config.next ? ['publish', '--tag', 'next'] : ['publish']

                            try {
                                const logOutput = `[${index + 1}/${proyectPackages.length}] Publishing package ${name}`
                                verbosity.dump(logOutput)
                                observer.next(logOutput)

                                setTimeout(() => {
                                    const { stdout } = execa.sync('npm', cliArgs, {
                                        cwd: packagePath,
                                    })
                                    verbosity.dump(stdout)
                                }, 150)

                            } catch (error) {
                                observer.next(`❌ Failed to publish > ${name} > ${error.message}`)
                            }
                        })

                        observer.complete()
                    })
                }
            },
            {
                title: '📢 Publish on Github',
                enabled: () => config.github === true,
                task: () => {
                    return new Observable((observer) => {
                        let changelogNotes = ""
                        const releaseTag = `v${getVersion()}`

                        try {
                            changelogNotes = getChangelogs(proyectGit)
                        } catch (error) {
                            verbosity.options({ dumpFile: true }).warn(`⚠️  Get changelogs failed! > ${error.message} \n`)
                            // really terrible
                        }

                        try {
                            execa.sync('git', ['commit', '--all', '--message', releaseTag])
                            execa.sync('git', ['tag', releaseTag])
                            execa.sync('git', ['push', 'origin', 'master', '--tags'])

                            const githubReleaseUrl = newGithubReleaseUrl({
                                repoUrl: proyectGit,
                                tag: releaseTag,
                                body: changelogNotes,
                                isPrerelease: config.preRelease,
                            })
                            open(githubReleaseUrl)
                            observer.complete(`⚠️ Continue github release manualy > ${githubReleaseUrl}`)
                        } catch (error) {
                            verbosity.dump(error)
                            observer.error(`❌ Failed github publish`)
                        }
                    })
                }

            }
        ]

        let tasks = {
            checkGit: {
                title: "📝 Checking git status",
                skip: () => config.skipStatus === true,
                task: () => {
                    return new Promise((resolve, reject) => {
                        const gitStatus = execa.sync('git', ['status', '--porcelain']).stdout
                        if (gitStatus.length) {
                            return reject(new Error("⛔️ Your git status is not clean"))
                        }
                        return resolve(gitStatus)
                    })
                }
            },
            buildProyect: {
                title: "📦 Building proyect",
                skip: () => config.skipBuild === true,
                task: () => {
                    return new Promise((resolve, reject) => {
                        buildProyect({ silent: true })
                            .then((done) => {
                                return resolve(true)
                            })
                            .catch((error) => {
                                return reject(new Error(`Failed build! > ${error.message}`))
                            })
                    })
                }
            },
            syncVersions: {
                title: "🔄 Syncing versions",
                skip: () => config.skipSyncVersion === true,
                task: () => {
                    bumpVersion(["patch"], true, { silent: true })
                    if (config.minor) {
                        bumpVersion(["minor"], true, { silent: true })
                    }
                    syncAllPackagesVersions()
                }
            },
            publish: {
                title: "📢 Publishing",
                task: () => {
                    return new Promise((resolve, reject) => {
                        new Listr(publishTasks, { collapse: false, concurrent: false }).run()
                            .then((done) => {
                                resolve(true)
                            })
                            .catch((err) => {
                                reject(err)
                            })
                    })
                }
            },
        }

        new Listr(objectToArrayMap(tasks).map((task) => { return task.value }), { collapse: false, concurrent: false }).run()
            .then((response) => {
                console.log(`✅ Publish done`)
                return resolve(true)
            }).catch((error) => {
                verbosity.error(`❌ Failed publish >`, error.message)
                return reject(error)
            })
    })
}