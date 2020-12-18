#!/usr/bin/env node
const fs = require("fs")
const resolveCwd = require('resolve-cwd');

let command = null;
const isDev = fs.existsSync(resolveCwd('./.devflag'))

try {
    if (isDev){
        command = require(`${process.cwd()}/packages/cli/dist`);
    }else {
        command = require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
    }
} catch (e) {
    console.log(`❌ Nodecore failed to load CLI`)
}