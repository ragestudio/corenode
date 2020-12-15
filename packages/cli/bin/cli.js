#!/usr/bin/env node

let command = null;
try {
    command = require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist/index.js`);
} catch (e) {
    command = require(`${__dirname}/dist/index.js`);
}