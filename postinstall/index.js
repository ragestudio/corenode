// TODO: Complete postinstall development script

// - [x] Build entire proyect
// - [] Link packages as dependencies
// - [] Link internals modules to /nodecorejs/internals 

const path = require("path")
const fs = require("fs")
const execa = require("execa")
const Listr = require("listr")

const builderPath = path.resolve(process.cwd(), `packages/builder`)
const builderSrcPath = `${builderPath}/src`
const builderDistPath = `${builderPath}/dist`

if (!fs.existsSync(builderSrcPath)) {
    throw new Error(`Builder source not exists > ${builderSrcPath}`)
}

const tasks = new Listr([
    {
        title: '🔗  Transform builder',
        task: () => {
            return new Promise((resolve, reject) => {
                execa('babel', [`${builderSrcPath}`, `--out-dir`, `${builderDistPath}`, `--config-file`, `${builderPath}/.babelrc`])
                    .then(done => resolve(done))
                    .catch(err => reject(err))
            })
        }
    },
    {
        title: '⚙️  Building proyect',
        task: () => {
            return new Promise((resolve, reject) => {
                const buildProyect = require(`${builderDistPath}/index.js`).default;
                buildProyect()
                    .then(done => resolve(done))
                    .catch(err => reject(err))
            })
        }
    }
])

tasks.run().catch(err => {
    console.error(err)
})