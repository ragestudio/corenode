const fs = require('fs')
const path = require('path')
const open = require("open")
const Listr = require("listr")
const execa = require('execa')

const { Observable } = require('rxjs')

const { getPackages, getOriginGit, getVersion, isProjectMode } = require('corenode')
const pkgManager = require("corenode/dist/packageManager")
const getChangelogs = require("../getChangelogs")

let { verbosity, objectToArrayMap, githubReleaseUrl } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[PUBLISH]" })

function publish(args) {
    return new Promise((resolve, reject) => {
        let projectPackages = getPackages()
        const isProject = isProjectMode()
        const env = global._env.publish ?? {}

        if (Array.isArray(env.ignorePackages)) {
            env.ignorePackages.forEach((ignore) => {
                if (Array.isArray(projectPackages)) {
                    projectPackages = projectPackages.filter(pkg => pkg !== ignore)
                }
            })
        }

        let config = {
            ignoreGit: false,
            npm: false,
            github: false,
            build: false,
            preRelease: false,
            next: false,
            fast: false,
        }

        if (typeof (args) !== "undefined") {
            config = { ...config, ...args }
        }

        let tasks = {
            checkGit: {
                title: "📝 Checking git status",
                skip: () => config.ignoreGit === true,
                task: () => {
                    return new Promise((res, rej) => {
                        const gitStatus = execa.sync('git', ['status', '--porcelain']).stdout
                        if (gitStatus.length) {
                            return rej(new Error("⛔️ Your git status is not clean"))
                        }

                        return res()
                    })
                }
            },
            buildProject: {
                title: "📦 Building project",
                enabled: () => config.build === true,
                task: async () => {
                    return new Promise(async (res, rej) => {
                        await buildProject()
                            .catch((error) => {
                                return rej(new Error(`Build failed! > ${error.message}`))
                            })

                        console.log(`\n\n`)
                        return res()
                    })
                }
            },
            npmRelease: {
                title: "📢 Publish on npm",
                enabled: () => config.npm === true,
                task: async () => {
                    return new Observable(async (observer) => {
                        let packagesCount = Number(0)

                        if (!Array.isArray(projectPackages) && !isProject) {
                            projectPackages = ["src"]
                        }

                        for await (const [index, pkg] of projectPackages.entries()) {
                            let lastError = null
                            const packagePath = isProject ? path.resolve(process.cwd(), `packages/${pkg}`) : process.cwd()
                            const pkgJSON = path.resolve(packagePath, 'package.json')

                            if (fs.existsSync(pkgJSON)) {
                                try {
                                    if (config.fast) {
                                        pkgManager.npmPublish(packagePath, config)
                                        packagesCount += 1
                                    } else {
                                        observer.next(`[${packagesCount}/${projectPackages.length}] Publishing npm package [${index}]${pkg}`)
                                        await pkgManager.npmPublish(packagePath, config)
                                            .then(() => {
                                                packagesCount += 1
                                                process.runtime.logger.dump("info", `+ published npm package ${pkg}`)
                                            })
                                    }
                                } catch (error) {
                                    lastError = `[${pkg}/${index}] ${error.message}`
                                    packagesCount += 1
                                    observer.next(`❌ Failed to publish > ${pkg} > ${error}`)
                                }

                                if (packagesCount >= projectPackages.length) {
                                    if (lastError != null) {
                                        return observer.error(new Error(lastError))
                                    }
                                    process.runtime.logger.dump("info", `Release successfully finished with [${projectPackages.length}] packages > ${projectPackages}`)
                                    setTimeout(() => {
                                        observer.complete()
                                    }, 850)
                                }
                            } else {
                                const errstr = `❌ ${pkg} has no valid package.json`
                                process.runtime.logger.dump("error", errstr)
                                observer.next(errstr)
                            }
                        }

                    })
                }
            },
            githubPublish: {
                title: '📢 Publish on Github',
                enabled: () => config.github === true,
                task: (ctx, task) => {
                    return new Promise((res, rej) => {
                        const gitRemote = getOriginGit()
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
                            return task.skip(`❌ Failed github publish`)
                        }
                    })
                },
            },
        }

        new Listr(objectToArrayMap(tasks).map((task) => { return task.value }), { collapse: false }).run()
            .then(response => {
                return resolve()
            }).catch((error) => {
                process.runtime.logger.dump("error", error)
                return reject(error)
            })
    })
}

module.exports = publish