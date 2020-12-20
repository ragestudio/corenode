#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

let command = null;
const isDev = fs.existsSync(path.resolve(process.cwd(), './.devflag'))

try {
    if (isDev){
        command = require(`${process.cwd()}/packages/cli/dist`);
    }else {
        command = require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
    }
} catch (e) {
    console.log(`❌ Nodecore failed to load CLI`)
    console.log(e)
}