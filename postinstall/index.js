const path = require("path")
const fs = require("fs")
const execa = require("execa")
const listr = require("listr")

const builderPath = path.resolve(process.cwd(), `packages/builder`)
const builderSrcPath = `${builderPath}/src`
const builderDistPath = `${builderPath}/dist`

if (!fs.existsSync(builderSrcPath)) {
    throw new Error(`Builder source not exists > ${builderSrcPath}`)
}

const tasks = new listr([
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
        title: '⚙️  Building project',
        task: () => {
            return new Promise((resolve, reject) => {
                const buildProject = require(`${builderDistPath}/index.js`).default;
                buildProject()
                    .then(done => resolve(done))
                    .catch(err => reject(err))
            })
        }
    }
])

tasks.run().catch(err => {
    console.error(err)
})