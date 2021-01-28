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
        let beforeVersion = getVersion()

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
                    let changelogNotes = ""
                    const releaseTag = `v${getVersion()}`

                    try {
                        changelogNotes = getChangelogs(proyectGit, `v${beforeVersion}`)
                    } catch (error) {
                        // really terrible
                    }

                    return new Observable((observer) => {
                        if (config.npm) {
                            if (!Array.isArray(proyectPackages) && isProyect) {
                                proyectPackages = ["_Proyect"]
                            }

                            proyectPackages.forEach((pkg, index) => {
                                const packagePath = isProyect ? path.resolve(process.cwd(), `packages/${pkg}`) : process.cwd()
                                const { name } = require(path.join(packagePath, 'package.json'))

                                observer.next(`[${index + 1}/${proyectPackages.length}] Publish package ${name}`)

                                const cliArgs = config.next ? ['publish', '--tag', 'next'] : ['publish']
                                try {
                                    const { stdout } = execa.sync('npm', cliArgs, {
                                        cwd: packagePath,
                                    })
                                    console.log(stdout)
                                } catch (error) {
                                    observer.next(`❌ Failed to publish > ${name} >`, error.message)
                                }
                            })
                        }

                        if (config.github) {
                            execa.sync('git', ['commit', '--all', '--message', releaseTag])
                            execa.sync('git', ['tag', releaseTag])
                            execa.sync('git', ['push', 'origin', 'master', '--tags'])

                            const githubReleaseUrl = newGithubReleaseUrl({
                                repoUrl: proyectGit,
                                releaseTag,
                                body: changelogNotes,
                                isPrerelease: config.preRelease,
                            })
                            try {
                                open(githubReleaseUrl)
                            } catch (error) {
                                // terrible
                            }
                            observer.complete(`⚠️ Continue github release manualy > ${githubReleaseUrl}`)
                        }

                        observer.complete()
                    })
                }
            },
        }

        if (config.skipStatus) {
            delete tasks["checkGit"]
        }
        if (config.skipBuild) {
            delete tasks["buildProyect"]
        }
        if (config.skipSyncVersion) {
            delete tasks["syncVersions"]
        }

        new Listr(objectToArrayMap(tasks).map((task) => { return task.value }), { collapse: false }).run()
            .then((response) => {
                console.log(`✅ Publish done`)
                return resolve(true)
            }).catch((error) => {
                verbosity.error(`❌ Failed publish >`, error.message)
                return reject(error)
            })
    })
}