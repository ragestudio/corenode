// [utest]

const moduleInstall = require('./packages/nodecorejs/dist/core/moduleInstall').default
const fs = require("fs")
const path = require("path")
const rimraf = require("rimraf")

const testingModulePath = path.resolve(process.cwd(), 'testingExampleModule')
if (fs.existsSync(testingModulePath)) {
    rimraf.sync(testingModulePath)
}

let writeData = {
    pkg: "testingModule",
    file: path.resolve(testingModulePath, `.module.js`)
}

let writeModule = {
    pkg: "testingAwesomeModule",
    init: function (lib) {
        console.log(lib)
    }
}

fs.mkdirSync(testingModulePath)
fs.writeFileSync(`${testingModulePath}/manifest.json`, JSON.stringify(writeData, null, 2) + '\n', 'utf-8')
fs.writeFileSync(`${testingModulePath}/.module.js`, JSON.stringify(writeModule, null, 2) + '\n', 'utf-8')

moduleInstall(testingModulePath)

rimraf.sync(testingModulePath)