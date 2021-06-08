const path = require('path')
const fs = require('fs')
const builder = require('@corenode/builder')
const execa = require('execa')

const tasks = ["compileSource", "compileBinaries", "compileDocker"]

const DOCKER_IMAGE = global._env?.development?.dockerImageName ?? "ragestudio/corenode"
const DOCKER_FILE = path.resolve(process.cwd(), "docker/Dockerfile")

const fn = {
    compileSource: async () => {
        await builder.default({ cliui: true })
    },
    compileBinaries: async () => {
        await execa("corenode", path.resolve(__dirname, "./binariesBuild.js"))
    },
    compileDocker: async () => {
        await execa("docker", ["build", "-t", DOCKER_IMAGE, `--file`, `${DOCKER_FILE}`])
    }
}

async function build() {
    for await (const task of tasks) {
        await fn[task]()
    }
}

build()