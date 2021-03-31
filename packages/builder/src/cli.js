#!/usr/bin/env node
!async function () {
    const buildProject = require("./index").default
    await buildProject({ cliui: true })
}()