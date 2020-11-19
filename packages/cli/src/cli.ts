#!/usr/bin/env node

let command = null;
try {
    command = require(`${process.cwd()}/node_modules/@nodecore/cli/dist`);
} catch (e) {
    command = require("@nodecore/cli/dist");
}