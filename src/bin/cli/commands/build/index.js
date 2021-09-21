const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')

async function syncPackageManifest() {
    let rootPackage = require(path.resolve(process.cwd(), 'package.json'))

    // fix main script
    rootPackage.main = process.env.fixedMainScript ?? "./index.js"

    fs.writeFileSync(path.resolve(process.cwd(), 'dist/package.json'), JSON.stringify(rootPackage, null, 2))
}

module.exports = {
    command: 'build',
    description: "Build this current project",
    arguments: [
        { argument: "[inputDir]", default: path.resolve(process.cwd(), "src") },
        { argument: "[outDir]", default: path.resolve(process.cwd(), "dist") }
    ],
    options: [
        { option: "--clean", description: "Make a clean build" },
        { option: "-fx, --fix", description: "Sync root `package.json` into `dist`" },
        { option: "-p, --parallel", description: "Enable parallel build" },
        { option: "--packages", description: "Enable build packages for monorepos" },
        { option: "--excludePackages <packages...>", description: "Exclude packages from being traversed" },
        { option: "--excludeSources <paths...>", description: "Directories that should not be traversed" },
        { option: "--ignoreSources <paths...>", description: "Avoid transformation, only pass through original source" },
        { option: "-pj, --project <dir>", description: "Compile a TypeScript project, will read from tsconfig.json in <dir>" },
        { option: "--out-extension <extension>", description: "File extension to use for all output files.", default: "js" },
        { option: "-t, --transforms <transforms>", description: "Comma-separated list of transforms to run." },
        { option: "-q, --quiet", description: "Don't print the names of converted files." },
        { option: "--enable-legacy-typescript-module-interop", description: "Use default TypeScript ESM/CJS interop strategy." },
        { option: "--enable-legacy-babel5-module-interop", description: "Use Babel 5 ESM/CJS interop strategy." },
        { option: "--jsx-pragma <string>", description: "Element creation function, defaults to `React.createElement`" },
        { option: "--jsx-fragment-pragma <string>", description: "Fragment component, defaults to `React.Fragment`" },
        { option: "--production", description: "Disable debugging information from JSX in output." },
    ],
    exec: async (inputDir, outputDir, params) => {
        const { lib } = require("@@transcompiler")
        const builderEnv = process.env.builder ?? {}
        let tasks = Array()

        function appendBuildToTasks(payload) {
            async function build(_payload) {
                await lib.build(_payload)
            }

            tasks.push(() => build(payload))
        }

        // ignored means not transpile the source, only pass through
        // let ignoredPackages = [...(Array.isArray(params.ignorePackages) ? params.ignorePackages : []), ...(Array.isArray(builderEnv.ignorePackages) ? builderEnv.ignorePackages: [])]
        params.ignoreSources = [...(Array.isArray(params.ignoreSources) ? params.ignoreSources : []), ...(Array.isArray(builderEnv.ignoreSources) ? builderEnv.ignoreSources : [])]

        // "excluded" means excluded from task (So no transpile or copy sources, the source will not be included on dist)
        params.excludeSources = [...(Array.isArray(params.excludeSources) ? params.excludeSources : []), ...(Array.isArray(builderEnv.excludeSources) ? builderEnv.excludeSources : [])]
        let excludedPackages = [...(Array.isArray(params.excludePackages) ? params.excludePackages : []), ...(Array.isArray(builderEnv.excludePackages) ? builderEnv.excludePackages : [])]

        let defaultsTransforms = ["jsx", "imports", "typescript"]
        let defaultInput = path.join(process.cwd(), "src")
        let defaultOutput = path.join(process.cwd(), "dist")
        let defaultPackagesPath = path.join(process.cwd(), 'packages')

        // override defaults
        if (typeof builderEnv.transforms !== "undefined") {
            if (Array.isArray(builderEnv.transforms)) {
                defaultsTransforms = builderEnv.transforms
            }
        }

        if (typeof builderEnv.input !== "undefined") {
            defaultInput = builderEnv.input
        }
        if (typeof builderEnv.output !== "undefined") {
            defaultOutput = builderEnv.output
        }

        // fullfil required undefined params
        if (typeof params.transforms === "undefined") {
            params.transforms = defaultsTransforms
        }

        if (!inputDir) {
            inputDir = builderEnv.input ?? defaultInput
        }
        if (!outputDir) {
            outputDir = builderEnv.output ?? defaultOutput
        }

        // handle monorepo packages
        if (params.packages) {
            const packagesPath = builderEnv.packagesPath ?? defaultPackagesPath
            const packages = fs.readdirSync(packagesPath).filter((pkg) => fs.lstatSync(path.join(packagesPath, pkg)).isDirectory()).filter((pkg) => !excludedPackages.includes(pkg))

            const sources = packages.map((dir) => {
                return path.resolve(packagesPath, dir, "src")
            })
            const outputs = packages.map((dir) => {
                return path.resolve(packagesPath, dir, 'dist')
            })

            sources.forEach((source, index) => {
                const src = source
                const out = outputs[index]

                appendBuildToTasks({ inputDir: src, outputDir: out, ...params })
            })
        }

        // handle clean build
        if (params.clean) {
            await rimraf.sync(outputDir)
        }

        // append source build tasks
        appendBuildToTasks({ inputDir, outputDir, ...params })

        // exec tasks
        if (params.parallel) {
            await Promise.all(tasks.map((fn) => fn()))
        } else {
            for (const fn of tasks) {
                await fn()
            }
        }

        // handle manifest sync fix
        if (params.fix) {
            if (!params.quiet) {
                console.log(`⚙️  Syncing package manifest\n`)
            }
            await syncPackageManifest()
        }
    }
}