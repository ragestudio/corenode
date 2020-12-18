#!/usr/bin/env node
const fs = require("fs")
const process = require("process")

let command = null;
const isDev = fs.existsSync(process.cwd(), './.devflag')

try {
    command = require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
} catch (e) {
    if (isDev){
        command = require(`${process.cwd()}/packages/cli/dist`);
    }else {
        console.log(`❌ nodecore-cli failed`)
    }
}