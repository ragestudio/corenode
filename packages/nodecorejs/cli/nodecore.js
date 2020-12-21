#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const isDev = fs.existsSync(path.resolve(__dirname, '../.local'))

try {
    //console.log(`${isDev? 'Running NodecoreJS on .local mode' : ''}`)
    if (isDev){
        require(`${process.cwd()}/packages/cli/dist`);
    }else {
        require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
    }
} catch (e) {
    try {
        require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
    } catch (error) {
        console.log(`❌ Nodecore failed to load CLI`)
        console.log(e)
    }
}