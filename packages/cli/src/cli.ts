#!/usr/bin/env node

let command = null;
try {
    command = require(`${process.cwd()}/node_modules/@nodecorejs/cli/dist`);
} catch (e) {
    command = require("@nodecorejs/cli/dist");
}