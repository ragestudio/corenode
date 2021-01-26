import chalk from 'chalk'
import execa from 'execa'
import fs from 'fs'
import path from 'path'
import process from 'process'
import newGithubReleaseUrl from 'new-github-release-url'
import open from 'open'
import { getPackages, getGit, bumpVersion, syncAllPackagesVersions, getVersion, getDevRuntimeEnv } from '@nodecorejs/dot-runtime'

import { getChangelogs } from '../utils/getChangelogs'
import exec from '../utils/exec'
// TODO: Support for release nodecore modules to Relic services


// TODO: Auto throwback when crash
const rootPackageJSONPath = path.resolve(process.cwd(), './package.json')

function printErrorAndExit(message) {
    console.error(chalk.red(message))
    process.exit(1)
}

function logStep(name) {
    // TODO: Replace with verbosity API
    console.log(`${chalk.gray('>> Release:')} ${chalk.magenta.bold(name)}`)
}

let devRuntime = getDevRuntimeEnv()
let currVersion = getVersion()

const pkgs = getPackages()

let stateCache = {}

export async function releaseProyect(args) {
    if (!devRuntime) {
        return printErrorAndExit(`devRuntime is missing on runtime`)
    }

    let opts = {
        nodecoreModule: false,
        publishNpm: false,
        preRelease: false,
        next: false,
        skipGitStatusCheck: false,
        publishOnly: false,
        skipBuild: false,
        minor: false,
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
    stateCache.releaseNotes = releaseNotes()

    if (!opts.publishOnly) {
        // Build
        if (!opts.skipBuild) {
            logStep('build')
            await exec('nodecore', ['build', '--silent'])
        } else {
            logStep('build is skipped, since args.skipBuild is supplied')
        }

        // Bump version
        bumpVersion(["patch"], true)

        if (opts.minor) {
            bumpVersion(["minor"], true)
        }

        // Sync version to root package.json
        logStep('sync versions')
        syncAllPackagesVersions()
        let rootPkg = require(rootPackageJSONPath)

        if (typeof (rootPkg["dependencies"]) !== "undefined") {
            Object.keys(rootPkg["dependencies"]).forEach((name) => {
                if (name.startsWith(devRuntime.headPackage)) {
                    rootPkg["dependencies"][name] = currVersion
                }
            })
            fs.writeFileSync(rootPackageJSONPath, JSON.stringify(rootPkg, null, 2), 'utf-8')
        }

        // Refesh Current Version
        currVersion = getVersion()

        // Commit
        const commitMessage = `release: v${currVersion}`
        logStep(`git commit with ${chalk.blue(commitMessage)}`)
        await exec('git', ['commit', '--all', '--message', commitMessage])

        // Git Tag
        logStep(`git tag v${currVersion}`)
        await exec('git', ['tag', `v${currVersion}`])

        // Push
        logStep(`git push`)
        await exec('git', ['push', 'origin', 'master', '--tags'])
    }

    // Publish
    logStep(`publish packages: ${chalk.blue(pkgs.join(', '))}`)
    if (opts.publishNpm) {
        pkgs.forEach((pkg, index) => {
            const pkgPath = path.join(process.cwd(), 'packages', pkg)
            const { name, version } = require(path.join(pkgPath, 'package.json'))
            if (version === currVersion) {
                console.log(`[${index + 1}/${pkgs.length}] Publish package ${name} ${opts.next ? 'with next tag' : ''}`)
                const cliArgs = opts.next ? ['publish', '--tag', 'next'] : ['publish']
                try {
                    const { stdout } = execa.sync('npm', cliArgs, {
                        cwd: pkgPath,
                    })
                    console.log(stdout)
                } catch (error) {
                    console.log(`❌ Failed to publish > ${pkg} >`, error)
                }
            }
        })
    }

    logStep('create github release')
    if (!devRuntime.originGit) {
        return printErrorAndExit(`originGit is missing on runtime`)
    }
    const tag = `v${currVersion}`
    const changelog = releaseNotes(tag)
    console.log(changelog)

    const url = newGithubReleaseUrl({
        repoUrl: getGit(),
        tag,
        body: changelog,
        isPrerelease: opts.preRelease,
    })
    try {
        await open(url)
    } catch (error) {
        console.log("Try opening url >", url)
    }

    logStep('done')
}

export default releaseProyect