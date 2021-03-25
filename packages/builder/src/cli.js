#!/usr/bin/env node
!async function () {
    const buildProyect = require("./index").default
    await buildProyect({ cliui: true })
}()