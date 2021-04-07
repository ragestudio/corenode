#!/usr/bin/env node

const buildProject = require("./dist/index").default
buildProject({ cliui: true })