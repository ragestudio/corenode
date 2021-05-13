const path = require("path")
const fs = require("fs")
const execa = require("execa")
const childProcess = require("child_process")
const listr = require("listr")

require("dotenv").config()

const builderPath = path.resolve(process.cwd(), `packages/builder`)
const builderSrcPath = `${builderPath}/src`
const builderDistPath = `${builderPath}/dist`
const internalsPath = path.resolve(process.cwd(), `packages/corenode/internals`)

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
                childProcess.exec('npm install --silent', { cwd: builderPath }, (err, stdout, stderr) => {
                    if (stderr) return reject(stderr)
                    if (err) return reject(err)
                    if (stdout) return resolve(stdout)
                })
            })
        }
    },
    {
        title: '🧰  Process internals',
        enabled: () => process.env.INSTALL_INIT,
        task: () => {
            return new Promise((resolve, reject) => {
                childProcess.exec('yarn install', { cwd: internalsPath }, (err, stdout, stderr) => {
                    if (stderr) return reject(stderr)
                    if (err) return reject(err)
                    if (stdout) {return resolve(stdout)}
                })    
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
       await require(`${builderDistPath}/index.js`).default({ cliui: true, from: internalsPath })
    })
    .catch(err => {
        console.error(err)
        process.exit(0)
    })