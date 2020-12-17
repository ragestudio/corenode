import { syncPackagesVersions, getDevRuntimeEnvs, bumpVersion, getVersion } from './index'

const { yParser, execa, chalk } = require('@nodecorejs/libs');
const { join } = require('path');
const { writeFileSync } = require('fs');
const newGithubReleaseUrl = require('new-github-release-url');
const open = require('open');
const exec = require('./utils/exec');
const getPackages = require('./utils/getPackages');
const isNextVersion = require('./utils/isNextVersion');
const { getChangelog } = require('./utils/changelog');

const cwd = process.cwd();
const args = yParser(process.argv.slice(2));
const currVersion = getVersion();
const runtimeEnvs = getDevRuntimeEnvs()

function printErrorAndExit(message) {
  console.error(chalk.red(message));
  process.exit(1);
}

function logStep(name) {
  // TODO: Replace with verbosity API
  console.log(`${chalk.gray('>> Release:')} ${chalk.magenta.bold(name)}`);
}

export async function release() {

}
