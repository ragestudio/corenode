const path = require('path')
const fs = require('fs')
const { publish, bootstrapProject, getChangelogs } = require("./scripts")
const { prettyTable } = require("@corenode/utils")

module.exports = [
    {
        command: 'addons',
        arguments: ["[action]", "[addon...]"],
        description: "Manage runtime addons",
        exec: async (action, id) => {
            if (!process.runtime.initialized) {
                await process.runtime.initialize()
            }

            switch (action) {
                case ("install"): {
                    if (id.length === 0) {
                        console.error("🛑 Usage: addons install <addon...>")
                    }
                    // TODO: [install] handle with addons dependencies manager
                    break
                }
                case ("remove"): {
                    // TODO: [remove] handle with addons dependencies manager
                    break
                }
                default: {
                    const controller = process.runtime.addonsController

                    if (!controller) {
                        return console.log(`!!! Addons controller is not available`)
                    }

                    const allAddons = controller.getLoadedAddons()
                    const pt = new prettyTable()

                    let headers = ["addon", "timings", "directory"]
                    let rows = []

                    allAddons.forEach((addon) => {
                        const loader = controller.loaders[addon]

                        const isRuntimed = loader.internal ?? false
                        const key = loader.pkg
                        const cwd = loader.file

                        rows.push([`${isRuntimed ? `⚙️ ` : `📦 `} ${key} ${loader.disabled ? "(disabled)" : ""}`, loader.timings ? JSON.stringify(loader.timings) : "none", cwd])
                    })

                    pt.create(headers, rows)
                    pt.print()
                    break
                }
            }
        }
    },
    {
        command: "bump-version",
        description: "Bump version of the project",
        arguments: ["<type...>"],
        exec: (type) => {
            const bumps = []

            type.forEach((bump) => {
                if (!bumps.includes(bump)) {
                    bumps.push(bump)
                }
            })

            if (bumps.length > 0) {
                process.runtime.helpers.bumpVersion(bumps)
                process.runtime.helpers.syncVersions()
            }
        },
    },
    {
        command: 'version',
        description: "Manage project version",
        options: ["--engine"],
        exec: (opts) => {
            const helpers = process.runtime.helpers

            const engineVersion = helpers.getVersion({ engine: true })
            const projectVersion = helpers.getVersion()

            const projectPkg = helpers.getRootPackage()
            const pt = new prettyTable()

            let headers = ["", "🏷  Version", "🏠  Directory"]
            let rows = []

            if (opts.engine) {
                rows.push(["Corenode™", `v${engineVersion}${helpers.isCorenodeProject() ? "@local" : ""}`, __dirname])
            }

            projectVersion ? rows.push([`📦  ${projectPkg.name ?? "Unnamed"}`, `v${projectVersion}`, process.cwd()]) : console.log("🏷  Version not available")

            if (rows.length > 0) {
                pt.create(headers, rows)
                pt.print()
            }
        }
    },
    {
        command: 'publish',
        description: "Publish this current project",
        options: ["--noTasks", "--ignoreGit", "--npm", "--github", "--fast", "--build", "--preRelease", "--packages", "--ignoreError"],
        exec: (opts) => {
            publish(opts)
                .then(() => {
                    console.log(`\n✅ Publish done`)
                })
                .catch((error) => {
                    console.error(error)
                    console.error(`\n❌ Publish aborted due an error`)
                })
        }
    },
    {
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
    },
    {
        command: 'legacy_build',
        description: "Build project with builtin builder",
        arguments: ["[dir...]"],
        exec: async (dirs) => {
            const { buildAllPackages, buildSource, Builder } = require("@@internals").builder

            if (dirs.length > 0) {
                dirs.forEach((dir) => {
                    const basename = path.basename(dir)
                    const output = path.resolve(dir, `../${basename}_dist`)

                    new Builder({ source: dir, output: output, taskName: basename, showProgress: true }).buildAllSources()
                })
            } else {
                const packagesPath = path.join(process.cwd(), 'packages')
                const sourcePath = path.join(process.cwd(), 'src')

                if (fs.existsSync(packagesPath) && fs.lstatSync(packagesPath).isDirectory()) {
                    console.log(`⚙️  Building all packages\n`)
                    await buildAllPackages()
                }

                if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isDirectory()) {
                    console.log(`⚙️  Building source\n`)
                    await buildSource()
                }
            }
        }
    },
    {
        command: 'bootstrap',
        description: "Bootstrap all packages",
        exec: (argv) => {
            bootstrapProject(argv)
                .then((res) => {
                    console.log(`✅ DONE`)
                })
        }
    },
    {
        command: 'sync',
        arguments: ["[packageName]"],
        description: "Sync project versions",
        exec: (packageName) => {
            const helpers = process.runtime.helpers
            console.log(`🔄 Syncing versions...`)

            if (!packageName) {
                return helpers.syncAllPackagesVersions()
            }
            return helpers.syncPackageVersionFromName(packageName, args.write)
        }
    },
    {
        command: 'changelogs',
        arguments: ["[to]", "[from]"],
        description: "Show the changelogs of this project from last tag",
        exec: async (to, from) => {
            const changes = await getChangelogs(process.runtime.helpers.getOriginGit(), to, from)
            console.log(changes)
        }
    }
]