const path = require("path")
const fs = require("fs")
const execa = require("execa")
const listr = require("listr")

const internalsPath = path.resolve(process.cwd(), `packages/nodecorejs/internals`)
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
        title: '⚙️  Building proyect',
        task: () => {
            return new Promise((resolve, reject) => {
                const buildProyect = require(`${builderDistPath}/index.js`).default;
                buildProyect()
                    .then(done => resolve(done))
                    .catch(err => reject(err))
            })
        }
    },
    {
        title: '🔦  Linking internals',
        skip: () => true, // Skiped for development
        task: () => {
            return new Promise((resolve, reject) => {
                let findUp = ['test-module', 'verbosity-dump-module', 'docs-module'] // TODO: autofetch

                findUp.forEach((pkg) => {
                    const linkingPath = path.resolve(internalsPath, `${pkg}`)
                    const internalPath = path.resolve(process.cwd(), `packages/${pkg}`)
                    if (fs.existsSync(internalPath) && !fs.existsSync(linkingPath)) {
                        // fs.symlinkSync(internalPath, linkingPath)
                    }
                })

                resolve()
            })
        }
    }
])

tasks.run().catch(err => {
    console.error(err)
})