import path from 'path'
import open from 'open'
import Listr from 'listr'
import execa from 'execa'
import process from 'process'

import newGithubReleaseUrl from 'new-github-release-url'
import { Observable } from 'rxjs'

import { getPackages, getGit, bumpVersion, syncAllPackagesVersions, getVersion, isProyectMode } from '@@nodecore'
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

        let tasks = {
            checkGit: {
                title: "📝 Checking git status",
                skip: () => config.skipStatus === true,
                task: () => {
                    return new Promise((res, rej) => {
                        const gitStatus = execa.sync('git', ['status', '--porcelain']).stdout
                        if (gitStatus.length) {
                            return rej(new Error("⛔️ Your git status is not clean"))
                        }
                        return res(gitStatus)
                    })
                }
            },
            buildProyect: {
                title: "📦 Building proyect",
                skip: () => config.skipBuild === true,
                task: () => {
                    return new Promise((res, rej) => {
                        buildProyect({ silent: true, buildBuilder: true })
                            .then((done) => {
                                res(true)
                            })
                            .catch((error) => {
                                rej(new Error(`Failed build! > ${error.message}`))
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
            npmRelease: {
                title: "📢 Publish on NPM",
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
                            const logOutput = `[${index + 1}/${proyectPackages.length}] Publishing npm package ${name}`

                            try {
                                verbosity.dump(logOutput)
                                observer.next(logOutput)

                                const { stdout } = execa.sync('npm', cliArgs, {
                                    cwd: packagePath,
                                })
                                verbosity.options({ dumpFile: true, method: "[publish]" }).log(stdout)
                                if ((index + 1) == proyectPackages.length) {
                                    verbosity.dump(`NPM Release successfuly finished with [${proyectPackages.length}] packages > ${proyectPackages}`)
                                    observer.complete()
                                }
                            } catch (error) {
                                observer.next(`❌ Failed to publish > ${name} > ${error.message}`)
                            }
                        })
                    })
                }
            },
            githubPublish: {
                title: '📢 Publish on Github',
                enabled: () => config.github === true,
                task: (ctx, task) => {
                    return new Promise((res, rej) => {
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
                            console.log(`\n ⚠️  Continue github release manualy > ${githubReleaseUrl}`)
                            res()
                        } catch (error) {
                            verbosity.dump(error)
                            task.skip(`❌ Failed github publish`)
                            rej()
                        }
                    })
                },
            },
        }

        new Listr(objectToArrayMap(tasks).map((task) => { return task.value }), { collapse: false }).run()
            .then(response => {
                console.log(`✅ Publish done`)
                return resolve(true)
            }).catch((error) => {
                verbosity.error(`❌ Failed publish >`, error.message)
                return reject(error)
            })
    })
}