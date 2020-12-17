// find up these files
const syncEnvs = ['.nodecore', '.nodecore.js', '.nodecore.ts', '.nodecore.json']
import path from 'path'
import process from 'process'
import getPackages from './utils/getPackages'
import fs from 'fs'
import bootstrap from './bootstrap'
import { IRuntimeEnv } from './types'
import chalk from 'chalk'
import execa from 'execa'

const rootPackageJSON = path.resolve(process.cwd(), './package.json')
const versionFile = path.resolve(process.cwd(), './.version')
const findenvs = require('find-up').sync(syncEnvs)

const { join } = require('path')
const newGithubReleaseUrl = require('new-github-release-url')
const open = require('open')
const exec = require('./utils/exec')
const isNextVersion = require('./utils/isNextVersion')
const getChangelog = require('./utils/changelog')

export let version: string
export let parsedVersion: any = {
    major: 0,
    minor: 0,
    patch: 0
}
let runtimeEnv = <IRuntimeEnv>{}

if (findenvs) {
    try {
        // @ts-ignore
        runtimeEnv = JSON.parse(fs.readFileSync(findenvs))
    } catch (error) {
        console.log("Failed trying load runtime env")
        // (⓿_⓿) terrible...
    }
} else {
    console.log("Runtime env (.nodecore) is missing")
}

try {
    version = getVersion()
    const parsed = version.split('.')

    parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
    parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
    parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0
} catch {
    // terrible...
}


export const bootstrapProyect = () => {
    return bootstrap()
}

export const getWachtedEnv = () => {
    return syncEnvs
}

export const getRuntimeEnv = () => {
    return runtimeEnv
}

export const getDevRuntimeEnvs: any = () => {
    if (!runtimeEnv || typeof (runtimeEnv.devRuntime) == "undefined") {
        return false
    }
    return runtimeEnv.devRuntime
}

export const getGit = () => {
    const envs = getDevRuntimeEnvs()
    if (!envs || typeof (envs.originGit) == "undefined") {
        return false
    }
    return envs.originGit
}

export const getrootPackageJSON = () => {
    if (!rootPackageJSON) {
        return false
    }
    try {
        // @ts-ignore
        const fileStream = JSON.parse(fs.readFileSync(rootPackageJSON))
        if (fileStream) {
            return fileStream
        }
        return false
    } catch (error) {
        return false
    }
}

export function parsedVersionToString(version: any) {
    return `${version.major}.${version.minor}.${version.patch}`
}

export function getDevPackages() {
    return getPackages()
}

export function getVersion() {
    const versionFilePath = path.resolve(process.cwd(), './.version')
    if (!fs.existsSync(versionFilePath)) {
        console.log(`.version file not exist, creating...`)
        fs.writeFileSync(versionFilePath, rootPackageJSON.version)
    }
    return fs.readFileSync(versionFilePath, 'utf8')
}

export function updateVersion(to) {
    if (!to) {
        return false
    }
    let updated

    if (typeof (to) == "object") {
        updated = parsedVersionToString(to)
    } else {
        const parsed = to.split('.')
        parsedVersion.major = parsed[0] ? Number(parsed[0]) : 0
        parsedVersion.minor = parsed[1] ? Number(parsed[1]) : 0
        parsedVersion.patch = parsed[2] ? Number(parsed[2]) : 0

        updated = parsedVersionToString(parsedVersion)
    }

    console.log(`✅ Version updated to > ${updated}`)
    return fs.writeFileSync(versionFile, updated)
}

export function bumpVersion(params) {
    const bumps = {
        major: params.includes("major"),
        minor: params.includes("minor"),
        patch: params.includes("patch"),
    }

    if (bumps.major) {
        parsedVersion.major = parsedVersion.major + 1
        parsedVersion.minor = 0
        parsedVersion.path = 0
    }
    if (bumps.minor) {
        parsedVersion.minor = parsedVersion.minor + 1
        parsedVersion.path = 0
    }
    if (bumps.patch) {
        parsedVersion.patch = parsedVersion.patch + 1
    }

    function bumpTable(major, minor, patch) {
        this.major = major ? parsedVersion.major : false;
        this.minor = minor ? parsedVersion.minor : false;
        this.patch = patch ? parsedVersion.patch : false;
    }
    console.table(new bumpTable(bumps.major, bumps.minor, bumps.patch));

    return updateVersion(parsedVersion)
}

export function syncPackagesVersions() {
    const pkgs = getPackages()
    pkgs.forEach((pkg) => {
        try {
            const pkgFilePath = path.resolve(process.cwd(), `./packages/${pkg}/package.json`)
            if (!fs.existsSync(pkgFilePath)) {
                console.log(`[${pkg}] ❌ This package is not bootstraped! > package.json not found. > Run npm run bootstrap for init this package.`)
                return false
            }
            const pkgFile = JSON.parse(fs.readFileSync(pkgFilePath, 'utf8'))
            if (pkgFile.version !== version) {
                console.log(`[${pkg}] ✅ New version synchronized`)
                return fs.writeFileSync(pkgFilePath, version)
            }
            console.log(`[${pkg}] 💠 Version is synchronized, no changes have been made...`)
        } catch (error) {
            console.error(`[${pkg}] ❌ Error syncing ! > ${error}`)
        }
    })
}

function printErrorAndExit(message) {
  console.error(chalk.red(message));
  process.exit(1);
}

function logStep(name) {
  // TODO: Replace with verbosity API
  console.log(`${chalk.gray('>> Release:')} ${chalk.magenta.bold(name)}`);
}

export const releaseProyect = async (args:any) => {
    let opts = { 
        skipGitStatusCheck: false,
        publishOnly: false,
        skipBuild: false
    }
  
    if (typeof(args) !== "undefined") {
        opts = { ...opts, ...args }
    }

    // Check git status
    if (!opts.skipGitStatusCheck) {
        const gitStatus = execa.sync('git', ['status', '--porcelain']).stdout;
        if (gitStatus.length) {
            printErrorAndExit(`Your git status is not clean. Aborting.`);
        }
    } else {
        logStep(
            'git status check is skipped, since --skip-git-status-check is supplied',
        );
    }

    // get release notes
    logStep('get release notes');
    const releaseNotes = await getChangelog();
    console.log(releaseNotes(''));

    // Check npm registry
    logStep('check npm registry');
    const userRegistry = execa.sync(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['config', 'get', 'registry']).stdout;
    if (userRegistry.includes('https://registry.yarnpkg.com/')) {
        printErrorAndExit(
            `Release failed, please use ${chalk.blue('npm run release')}.`,
        );
    }
    if (!userRegistry.includes('https://registry.npmjs.org/')) {
        const registry = chalk.blue('https://registry.npmjs.org/');
        printErrorAndExit(`Release failed, npm registry must be ${registry}.`);
    }

    if (!opts.publishOnly) {
        // Build
        if (!opts.skipBuild) {
            logStep('build');
            await exec('nodecore', ['build']);
        } else {
            logStep('build is skipped, since args.skipBuild is supplied');
        }

        // Bump version
        bumpVersion(["minor"])

        // Sync version to root package.json
        logStep('sync version to root package.json');
        syncPackagesVersions()
        const rootPkg = require('../package');
        Object.keys(rootPkg.devDependencies).forEach((name) => {
            if (name.startsWith('@nodecorejs/')) {
                rootPkg.devDependencies[name] = version;
            }
        });
        fs.writeFileSync(join(process.cwd(), '..', 'package.json'), JSON.stringify(rootPkg, null, 2) + '\n', 'utf-8');

        // Commit
        const commitMessage = `release: v${version}`;
        logStep(`git commit with ${chalk.blue(commitMessage)}`);
        await exec('git', ['commit', '--all', '--message', commitMessage]);

        // Git Tag
        logStep(`git tag v${version}`);
        await exec('git', ['tag', `v${version}`]);

        // Push
        logStep(`git push`);
        await exec('git', ['push', 'origin', 'master', '--tags']);
    }

    const currVersion = getVersion()
    // Publish
    if (!runtimeEnv.devRuntime) {
        return printErrorAndExit(`headPackage is missing on runtime`);
    }

    const pkgs = getPackages();
    logStep(`publish packages: ${chalk.blue(pkgs.join(', '))}`);
    const isNext = isNextVersion(currVersion);
    pkgs.sort((a) => {
        return a === runtimeEnv.devRuntime.headPackage ? 1 : -1;
    })
        .forEach((pkg, index) => {
            const pkgPath = join(process.cwd(), 'packages', pkg);
            const { name, version } = require(join(pkgPath, 'package.json'));
            if (version === currVersion) {
                console.log(
                    `[${index + 1}/${pkgs.length}] Publish package ${name} ${isNext ? 'with next tag' : ''
                    }`,
                );
                const cliArgs = isNext ? ['publish', '--tag', 'next'] : ['publish'];
                try {
                    const { stdout } = execa.sync('npm', cliArgs, {
                        cwd: pkgPath,
                    })
                    console.log(stdout);
                } catch (error) {
                    console.log(`❌ Failed to publish > ${pkg} >`, err)
                }
            }
        });


    if (!runtimeEnv.devRuntime.originGit) {
        return printErrorAndExit(`originGit is missing on runtime`);
    }

    logStep('create github release');
    const tag = `v${currVersion}`;
    const changelog = releaseNotes(tag);
    console.log(changelog);
    const url = newGithubReleaseUrl({
        repoUrl: runtimeEnv.devRuntime.originGit,
        tag,
        body: changelog,
        isPrerelease: isNext,
    });
    try {
        await open(url);
    } catch (error) {
        console.log("Try opening url >", url)
    }

    logStep('done');
}

export default runtimeEnv