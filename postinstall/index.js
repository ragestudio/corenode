const path = require("path")
const fs = require("fs")
const execa = require("execa")
const exec = require("child_process").exec
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
        title: '📦  Install dependencies',
        task: () => {
            return new Promise((resolve, reject) => {
                exec('npm install --silent', { cwd: builderPath }, (err, stdout, stderr) => {
                    if (stderr) return reject(stderr)
                    if (err) return reject(err)
                    if (stdout) return resolve(stdout)
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
    .then(done => {
       require(`${builderDistPath}/index.js`).default({ cliui: true })
    })
    .catch(err => {
        console.error(err)
        process.exit(0)
    })