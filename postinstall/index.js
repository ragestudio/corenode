// TODO: Complete postinstall development script

// cd ./packages/builder && npm i && yarn build && cd ../../ && yarn run builder
// - [] Run install dependencies
// - [x] Build entire proyect
// - [] Link packages as dependencies
// - [] Link internals modules to /nodecorejs/internals 

const path = require("path")
const fs = require("fs")
const execa = require("execa")

const builderSrcPath = path.resolve(process.cwd(), `packages/builder/src`)
const builderDistPath = path.resolve(process.cwd(), `packages/builder/dist`)

if (!fs.existsSync(builderSrcPath)) {
    throw new Error(`Builder not exists`)
}

execa.sync('babel', [`${builderSrcPath}`, `--out-dir`, `${builderDistPath}`])