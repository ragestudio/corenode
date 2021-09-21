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

const env = process.env.publish ?? {}

function publish(args = {}) {
    let config = {
        noTasks: false,
        ignoreGit: false,
        npm: false,
        github: false,
        build: false,
        preRelease: false,
        fast: false,
        packages: false,
        ignoreError: false,
        ...args
    }

    return new Promise((resolve, reject) => {
        let packages = config.packages ? (getAllPackages() ?? []) : false
        let paths = []

        // filter ignored packages
        if (Array.isArray(env.ignorePackages) && Array.isArray(packages)) {
            env.ignorePackages.forEach((ignore) => {
                packages = packages.filter(pkg => pkg !== ignore)
            })
        }

        // set resolved paths from packages
        if (Array.isArray(packages)) {
            packages.forEach((pkg) => {
                const packagePath = path.resolve(process.cwd(), `packages/${pkg}`)
                paths.push(packagePath)
            })
        }

        // set paths from env
        if (Array.isArray(env.include)) {
            env.include.forEach((include) => {
                const includePath = path.isAbsolute(include) ? path.resolve(include) : path.resolve(process.cwd(), include)
                paths.push(includePath)
            })
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
            npmRelease: {
                title: "📢 Publish on npm",
                enabled: () => config.npm === true,
                task: async () => {
                    return new Observable(async (observer) => {
                        let packagesCount = Number(0)

                        for await (const [index, pkg] of paths.entries()) {
                            let lastError = null
                            const pkgJSON = path.resolve(pkg, 'package.json')

                            if (fs.existsSync(pkgJSON)) {
                                try {
                                    if (config.fast) {
                                        pkgManager.npmPublish(pkg, config)
                                        packagesCount += 1
                                    } else {
                                        observer.next(`[${packagesCount}/${paths.length}] Publishing npm package [${index}]${pkg}`)
                                        await pkgManager.npmPublish(pkg, config)
                                            .then(() => {
                                                packagesCount += 1
                                                process.runtime.logger.dump("info", `+ published npm package ${pkg}`)
                                            })
                                    }
                                } catch (error) {
                                    const errStr = `❌ Failed to publish > ${pkg} > ${error}`
                                    lastError = `[${path.basename(pkg)}/${index}] ${error.message}`
                                    packagesCount += 1

                                    if (config.ignoreError) {
                                        observer.next(errStr)
                                    } else {
                                        return reject(new Error(errStr))
                                    }
                                }

                                if (packagesCount >= paths.length) {
                                    if (lastError != null) {
                                        if (config.ignoreError) {
                                            return observer.error(new Error(lastError))
                                        } else {
                                            return reject(new Error(lastError))
                                        }
                                    }

                                    process.runtime.logger.dump("info", `Release successfully finished with [${paths.length}] packages > ${paths}`)
                                    setTimeout(() => {
                                        observer.complete()
                                    }, 850)
                                }
                            } else {
                                const errStr = `❌ ${pkg} has no valid package.json`
                                process.runtime.logger.dump("error", errStr)
                                observer.next(errStr)
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

module.exports = {
    command: 'publish',
    description: "Publish this current project",
    options: ["--noTasks", "--ignoreGit", "--npm", "--github", "--fast", "--build", "--preRelease", "--packages", "--ignoreError"],
    exec: (opts) => {
        publish(opts)
            .then(() => {
                console.log(`\n✅ Publish done`)
            })
            .catch((error) => {
                console.error(error)
                console.error(`\n❌ Publish aborted due an error`)
            })
    }
}