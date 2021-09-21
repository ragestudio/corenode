const path = require('path')
const fs = require('fs')

module.exports = {
    command: 'build',
    description: "Build this current project",
    arguments: [
        { argument: "[inputDir]", default: path.resolve(process.cwd(), "src") },
        { argument: "[outDir]", default: path.resolve(process.cwd(), "dist") }
    ],
    options: [
        { option: "-p, --parallel", description: "Enable parallel build" },
        { option: "-pkgs, --packages", description: "Enable build packages for monorepos" },
        { option: "-ip, --ignorePackages <packages>", description: "Ignore build for packages name in <packages>" },
        { option: "-pj, --project <dir>", description: "Compile a TypeScript project, will read from tsconfig.json in <dir>" },
        { option: "--out-extension <extension>", description: "File extension to use for all output files.", default: "js" },
        { option: "--exclude-dirs <paths>", description: "Names of directories that should not be traversed." },
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

        let defaultsTransforms = ["jsx", "imports"]
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
            const excludedPackages = builderEnv.ignorePackages ?? []
            if (Array.isArray(params.ignorePackages)) {
                params.ignorePackages.forEach((pkg) => {
                    // TODO: check if package & name exists
                    excludedPackages.push(pkg)
                })
            }

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
    }
}