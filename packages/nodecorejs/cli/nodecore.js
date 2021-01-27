#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const process = require("process")

const nodecoreLocalFile = path.resolve(__dirname, '../../../.local')
const cliDist = path.resolve(__dirname, '../node_modules/@nodecorejs/cli/dist')

try {
    if (fs.existsSync(nodecoreLocalFile)){
        return require(`${process.cwd()}/packages/cli/dist`)
    }
    if (!fs.existsSync(cliDist)) {
        throw new Error(`CLI Script not found!`)
    }
    require(cliDist)
} catch (e) {
    try {
        require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`)
    } catch (error) {
        console.log(`❌ Failed Nodecore runtime`)
        console.log(e)
    }
}