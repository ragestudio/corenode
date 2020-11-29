#!/usr/bin/env node

const resolveCwd = require('resolve-cwd');

const { name, bin } = require('../package.json');
const localCLI = resolveCwd.silent(`${name}/${bin['nodecore']}`);
if (!process.env.USE_GLOBAL_UMI && localCLI && localCLI !== __filename) {
  const debug = require('@nodecorejs/utils').createDebug('nodecore:cli');
  debug('Using local install of nodecore');
  require(localCLI);
} else {
  require('../dist/cli');
}
