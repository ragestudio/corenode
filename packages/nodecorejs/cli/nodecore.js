#!/usr/bin/env node

let command = null;
try {
    command = require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
} catch (e) {
    command = require(`${process.cwd()}/packages/cli/dist`);
    console.log(`❌ nodecore-cli failed`)
}