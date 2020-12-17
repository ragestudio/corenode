import chalk from 'chalk'
import execa from 'execa'
import fs from 'fs'
import path from 'path'
import process from 'process'
import newGithubReleaseUrl from 'new-github-release-url'
import open from 'open'
import { getPackages, getGit, bumpVersion, syncPackagesVersions, getVersion } from '@nodecorejs/dot-runtime'

import { getChangelogs } from '../../utils/getChangelogs'
import isNextVersion from '../../utils/isNextVersion'
import exec from '../../utils/exec'

// TODO: Auto throwback when crash
const releaseBackupFile = path.resolve(process.cwd(), './.releaseBackup')

function printErrorAndExit(message) {
    console.error(chalk.red(message))
    process.exit(1)
}

function logStep(name) {
    // TODO: Replace with verbosity API
    console.log(`${chalk.gray('>> Release:')} ${chalk.magenta.bold(name)}`)
}

let currVersion = getVersion()
let lastState = null
let stateCache = {}

export async function releaseProyect(args) {
    if (fs.existsSync(releaseBackupFile)) {
        lastState = fs.readFileSync(releaseBackupFile, 'utf-8')
        if (lastState || lastState.crash) {
            stateCache = lastState
        }else {
            fs.unlinkSync(releaseBackupFile)
        }
    }

    let opts = {
        skipGitStatusCheck: false,
        publishOnly: false,
        skipBuild: false
    }

    if (typeof (args) !== "undefined") {
        opts = { ...opts, ...args }
    }

    // Check git status
    if (!opts.skipGitStatusCheck) {
        const gitStatus = execa.sync('git', ['status', '--porcelain']).stdout
        if (gitStatus.length) {
            printErrorAndExit(`Your git status is not clean. Aborting.`)
        }
    } else {
        logStep(
            'git status check is skipped, since --skip-git-status-check is supplied',
        )
    }

    // get release notes
    logStep('get release notes')
    const releaseNotes = await getChangelogs(getGit())
    stateCache.releaseNotes = releaseNotes

    // Check npm registry
    logStep('check npm registry')
    const userRegistry = execa.sync(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['config', 'get', 'registry']).stdout
    if (userRegistry.includes('https://registry.yarnpkg.com/')) {
        printErrorAndExit(
            `Release failed, please use ${chalk.blue('npm run release')}.`,
        )
    }
    if (!userRegistry.includes('https://registry.npmjs.org/')) {
        const registry = chalk.blue('https://registry.npmjs.org/')
        printErrorAndExit(`Release failed, npm registry must be ${registry}.`)
    }

    if (!opts.publishOnly) {
        // Build
        if (!opts.skipBuild) {
            logStep('build')
            await exec('nodecore', ['build'])
        } else {
            logStep('build is skipped, since args.skipBuild is supplied')
        }

        // TODO: Auto bump depending on `nextVersion`
        // Bump version
        bumpVersion(["patch"])

        // Sync version to root package.json
        logStep('sync version to root package.json')
        syncPackagesVersions()
        let rootPkg = require(path.resolve(process.cwd(), './package.json'))
        const versionUpdateDescriminator = ["devDependencies", "dependencies"]

        versionUpdateDescriminator.forEach((from) => {
            if (typeof(rootPkg[from]) !== "undefined") {
                Object.keys(rootPkg[from]).forEach((name) => {
                    if (name.startsWith('@nodecorejs/')) {
                        rootPkg[from][name] = currVersion
                    }
                })
                fs.writeFileSync(path.join(process.cwd(), '.', 'package.json'), JSON.stringify(rootPkg, null, 2) + '\n', 'utf-8')
            }
        })
        // Refesh Current Version
        currVersion = getVersion()

        // Commit
        const commitMessage = `release: v${version}`
        logStep(`git commit with ${chalk.blue(commitMessage)}`)
        await exec('git', ['commit', '--all', '--message', commitMessage])

        // Git Tag
        logStep(`git tag v${version}`)
        await exec('git', ['tag', `v${version}`])

        // Push
        logStep(`git push`)
        await exec('git', ['push', 'origin', 'master', '--tags'])
    }

    
    // Publish
    if (!runtimeEnv.devRuntime) {
        return printErrorAndExit(`headPackage is missing on runtime`)
    }

    const pkgs = getPackages()
    logStep(`publish packages: ${chalk.blue(pkgs.join(', '))}`)
    const isNext = isNextVersion(currVersion)
    pkgs.sort((a) => {
        return a === runtimeEnv.devRuntime.headPackage ? 1 : -1
    })
        .forEach((pkg, index) => {
            const pkgPath = path.join(process.cwd(), 'packages', pkg)
            const { name, version } = require(path.join(pkgPath, 'package.json'))
            if (version === currVersion) {
                console.log(
                    `[${index + 1}/${pkgs.length}] Publish package ${name} ${isNext ? 'with next tag' : ''
                    }`,
                )
                const cliArgs = isNext ? ['publish', '--tag', 'next'] : ['publish']
                try {
                    const { stdout } = execa.sync('npm', cliArgs, {
                        cwd: pkgPath,
                    })
                    console.log(stdout)
                } catch (error) {
                    fs.writeFileSync(releaseBackupFile, stateCache, 'utf-8')
                    console.log(`❌ Failed to publish > ${pkg} >`, err)
                }
            }
        })


    if (!runtimeEnv.devRuntime.originGit) {
        return printErrorAndExit(`originGit is missing on runtime`)
    }

    logStep('create github release')
    const tag = `v${currVersion}`
    const changelog = releaseNotes(tag)
    console.log(changelog)
    const url = newGithubReleaseUrl({
        repoUrl: runtimeEnv.devRuntime.originGit,
        tag,
        body: changelog,
        isPrerelease: isNext,
    })
    try {
        await open(url)
    } catch (error) {
        console.log("Try opening url >", url)
    }

    logStep('done')
}

export default releaseProyect