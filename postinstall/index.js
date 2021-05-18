const path = require("path")
const fs = require("fs")
const execa = require("execa")
const listr = require("listr")

require("dotenv").config()

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
        title: '📦  Install dependencies',
        task: () => {
            return new Promise((resolve, reject) => {
                execa('yarn', ['install'], { execPath: builderPath, cwd: builderPath })
                    .then(done => { return resolve(done) })
                    .catch(err => { return reject(err) })
            })
        }
    },
    {
        title: '🧰  Process internals',
        enabled: () => process.env.INSTALL_INIT,
        task: () => {
            return new Promise((resolve, reject) => {
                execa('yarn', ['install'], { execPath: internalsPath, cwd: internalsPath })
                    .then(done => { return resolve(done) })
                    .catch(err => { return reject(err) })
            })
        }
    },
    {
        title: '⚙️  Building project',
        task: () => {
            return true
        }
    }
])

tasks.run()
    .then(async (done) => {
        await require(`${builderDistPath}/index.js`).default({ cliui: true })
    })
    .catch(err => {
        console.error(err)
        process.exit(0)
    })