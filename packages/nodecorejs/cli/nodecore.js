#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")
const resolveCwd = require('resolve-cwd');

const isDev = fs.existsSync(path.resolve(__dirname, '../.local'))
const cliDist = resolveCwd.silent(`@nodecorejs/cli/dist`)

try {
    if (isDev){
        return require(`${process.cwd()}/packages/cli/dist`);
    }
    require(cliDist)
} catch (e) {
    try {
        require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
    } catch (error) {
        console.log(`❌ Nodecore failed to load CLI`)
        console.log(e)
    }
}