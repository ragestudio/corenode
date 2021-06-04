import fs from 'fs'
import path from 'path'
import open from 'open'
import Listr from 'listr'
import execa from 'execa'

import { Observable } from 'rxjs'

import { getPackages, getOriginGit, getVersion, isProjectMode } from 'corenode'
import buildProject from '@corenode/builder'
import getChangelogs from '../getChangelogs'

let { verbosity, objectToArrayMap, githubReleaseUrl } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[PUBLISH]" })

export function publishProject(args) {
    return new Promise((resolve, reject) => {
        let projectPackages = getPackages()

        const gitRemote = getOriginGit()
        const isProject = isProjectMode()

        let config = {
            skipStatus: false,
            skipBuild: false,
            npm: false,
            github: false,
            preRelease: false,
            next: false,
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
            buildProject: {
                title: "📦 Building project",
                skip: () => config.skipBuild === true,
                task: () => {
                    return new Promise((res, rej) => {
                        buildProject({ buildBuilder: true })
                            .then((done) => res())
                            .catch((error) => rej(new Error(`Failed build! > ${error.message}`)))
                    })
                }
            },
            npmRelease: {
                title: "📢 Publish on NPM",
                enabled: () => config.npm === true,
                task: () => {
                    return new Observable((observer) => {
                        let publishCount = Number(0)
                        if (!Array.isArray(projectPackages) && !isProject) {
                            projectPackages = ["_"]
                        }

                        projectPackages.forEach((pkg, index) => {
                            const packagePath = isProject ? path.resolve(process.cwd(), `packages/${pkg}`) : process.cwd()
                            const pkgJSON = path.resolve(packagePath, 'package.json')
                            const cliArgs = ['publish']

                            if (config.next) {
                                cliArgs.push('--tag', 'next')
                            }

                            if (fs.existsSync(pkgJSON)) {
                                try {
                                    const { name } = require(pkgJSON)
                                    const logOutput = `[${publishCount}/${projectPackages.length}] Published npm package ${name}[${index}]`

                                    execa('npm', cliArgs, { cwd: packagePath })
                                        .then((stdout) => {
                                            publishCount += 1
                                            process.runtime.logger.dump("info", logOutput)
                                            observer.next(logOutput)

                                            if (publishCount == (projectPackages.length - 1)) {
                                                process.runtime.logger.dump("info", `NPM Release successfuly finished with [${projectPackages.length}] packages > ${projectPackages}`)
                                                observer.complete()
                                            }
                                        })
                                } catch (error) {
                                    observer.next(`❌ Failed to publish > ${name} > ${error}`)
                                }
                            } else {
                                const errstr = `❌ ${pkg} has no valid package.json`
                                process.runtime.logger.dump("error", errstr)
                                observer.next(errstr)
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
                            changelogNotes = getChangelogs(gitRemote)
                        } catch (error) {
                            process.runtime.logger.dump("error", error)
                            verbosity.options({ method: false }).warn(`⚠️  Get changelogs failed!\n`)
                            // really terrible
                        }

                        try {
                            execa.sync('git', ['tag', releaseTag])
                            execa.sync('git', ['push', 'origin', 'master', '--tags'])
                        } catch (error) {
                            process.runtime.logger.dump("error", error)
                            return task.skip(`❌ Failed to tag release > ${error.message}`)
                        }

                        try {
                            const newGithubReleaseUrl = githubReleaseUrl({
                                repoUrl: gitRemote,
                                tag: releaseTag,
                                body: changelogNotes,
                                isPrerelease: config.preRelease,
                            })

                            console.log(`\n ⚠️  Continue github release manualy > ${newGithubReleaseUrl}`)
                            open(newGithubReleaseUrl)

                            return res()
                        } catch (error) {
                            process.runtime.logger.dump("error", error)
                            return task.skip(`❌ Failed github publish, skipping`)
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
                process.runtime.logger.dump("error", error)
                verbosity.options({ method: false }).error(`❌ Failed publish >`, error)
                return reject(error)
            })
    })
}