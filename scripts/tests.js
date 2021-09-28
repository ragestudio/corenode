#!/usr/bin/env corenode-node
import FastGlob from "fast-glob";
import path from "path"
import Mocha from 'mocha'

const testsRoot = path.resolve(process.cwd(), "tests")

const testsFiles = FastGlob.sync(["**/*.test.js", "**/*.test.ts"], { cwd: testsRoot })
const mochaInstance = new Mocha({
    require: path.resolve("../dist/bin/corenode-trans")
})

testsFiles.forEach((match) => {
    mochaInstance.addFile(path.resolve(testsRoot, match))
})

mochaInstance.run((errors) => {
    if (errors > 0) {
        console.log(`TESTS ERRORS [${errors}]`)
    }
})