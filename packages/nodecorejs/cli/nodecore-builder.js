#!/usr/bin/env node

let command = null;
try {
    command = require(`${process.cwd()}/node_modules/@nodecorejs/builder/dist/cli.js`);
} catch (e) {
    command = require(`${process.cwd()}/packages/builder/dist/cli.js`);
    console.log(`❌ nodecore-builder failed`)
}