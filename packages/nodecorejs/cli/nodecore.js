#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const isDev = fs.existsSync(path.resolve(__dirname, '../.local'))
const cliDist = path.resolve(__dirname, '../node_modules/@nodecorejs/cli/dist')

try {
    if (isDev){
        return require(`${process.cwd()}/packages/cli/dist`)
    }
    if (fs.existsSync(cliDist)) {
        require(cliDist)        
    }
} catch (e) {
    try {
        require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`)
    } catch (error) {
        console.log(`❌ Failed Nodecore runtime`)
        console.log(e)
    }
}