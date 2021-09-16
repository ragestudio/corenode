const fs = require('fs')
const path = require('path')
const open = require("open")
const Listr = require("listr")
const execa = require('execa')

const { Observable } = require('rxjs')

const { getAllPackages, getOriginGit, getVersion } = require("@corenode/helpers")
const pkgManager = require("@corenode/pkg-manager")
const getChangelogs = require("../getChangelogs")

let { verbosity, objectToArrayMap, githubReleaseUrl } = require('@corenode/utils')
verbosity = verbosity.options({ method: "[PUBLISH]" })

function publish(args) {
    return new Promise((resolve, reject) => {
        let packages = []

        let projectPackages = getAllPackages()
        const env = global._env.publish ?? {}

        // support multiple packages on monorepo
        if (Array.isArray(env.ignorePackages)) {
            env.ignorePackages.forEach((ignore) => {
                if (Array.isArray(projectPackages)) {
                    projectPackages = projectPackages.filter(pkg => pkg !== ignore)
                }
            })
        }

        console.log(projectPackages)

        let config = {
            noTasks: false,
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
                        return false
                        let packagesPaths = projectPackages.map((dir) => {
                            return path.resolve(process.cwd(), `packages/${dir}`)
                        })
                        let packagesCount = Number(0)

                        if (fs.existsSync(rootSource) && fs.lstatSync(rootSource).isDirectory()) {
                            packagesPaths.push(process.cwd())
                        }
                        
                        for await (const [index, pkg] of packagesPaths.entries()) {
                            let lastError = null
                            const pkgJSON = path.resolve(pkg, 'package.json')

                            if (fs.existsSync(pkgJSON)) {
                                try {
                                    if (config.fast) {
                                        pkgManager.npmPublish(pkg, config)
                                        packagesCount += 1
                                    } else {
                                        observer.next(`[${packagesCount}/${packagesPaths.length}] Publishing npm package [${index}]${pkg}`)
                                        await pkgManager.npmPublish(pkg, config)
                                            .then(() => {
                                                packagesCount += 1
                                                process.runtime.logger.dump("info", `+ published npm package ${pkg}`)
                                            })
                                    }
                                } catch (error) {
                                    lastError = `[${path.basename(pkg)}/${index}] ${error.message}`
                                    packagesCount += 1
                                    observer.next(`❌ Failed to publish > ${pkg} > ${error}`)
                                }

                                if (packagesCount >= packagesPaths.length) {
                                    if (lastError != null) {
                                        return observer.error(new Error(lastError))
                                    }
                                    process.runtime.logger.dump("info", `Release successfully finished with [${packagesPaths.length}] packages > ${packagesPaths}`)
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
                        return false
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

        if (config.noTasks) {
            return resolve(`No performing task, done.`)
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