const path = require('path')
const execa = require('execa')

const tasks = ["compileSource", "compileBinaries", "compileDocker"]

const DOCKER_FILE = path.join(process.cwd(), "Dockerfile")
const DOCKER_IMAGE = global._env?.development?.dockerImageName ?? "ragestudio/corenode"

const fn = {
    compileSource: async () => {
        if (process.args.noBuild) {
            return true
        }
        await require('@corenode/builder').default({ cliui: true })
    },
    compileBinaries: async () => {
        if (process.args.noBin) {
            return true
        }
        await require("./lib/binariesBuild")()
    },
    compileDocker: async () => {
        if (process.args.noDocker) {
            return true
        }

        console.log(DOCKER_IMAGE, DOCKER_FILE)

        try {
            const { stdout } = await execa(`docker`, ["build", "-t", DOCKER_IMAGE, "-f", DOCKER_FILE, "."])
            console.log(stdout)
        } catch (error) {
            runtime.logger.dump(error)
            console.error(error)
        }
    }
}

async function build() {
    for await (const task of tasks) {
        await fn[task]()
    }
}

build()