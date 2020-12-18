#!/usr/bin/env node
const fs = require("fs")
const process = require("process")

let command = null;
const isDev = fs.existsSync(process.cwd(), './.devflag')

try {
    command = require(`${process.cwd()}/node_modules/@nodecorejs/builder/dist/cli.js`);
} catch (e) {
    if (isDev){
        command = require(`${process.cwd()}/packages/builder/dist/cli.js`);
    }else {
        console.log(`❌ nodecore-builder failed`)
    }
}