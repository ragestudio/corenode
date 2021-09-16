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

            if (bump.length > 0) {
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
        description: "Build project with builtin builder",
        arguments: ["[dir...]"],
        exec: async (dirs) => {
            const { buildAllPackages, buildSource, Builder } = require("@@internals").builder

            if (dirs.length > 0) {
                dirs.forEach((dir) => {
                    const basename = path.basename(dir)
                    const output = path.resolve(dir,  `../${basename}_dist`)

                    new Builder({ source: dir, output: output, taskName: basename, showProgress: true }).buildAllSources()
                })
            }else {
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
        command: 'sync [package]',
        description: "Sync project versions",
        exec: (argv) => {
            const helpers = process.runtime.helpers
            console.log(`🔄 Syncing versions...`)
            if (!argv.package) {
                return helpers.syncAllPackagesVersions()
            }
            return helpers.syncPackageVersionFromName(argv.package, argv.write)
        }
    },
    {
        command: 'changelogs',
        description: "Show the changelogs of this project from last tag",
        exec: async (argv) => {
            const changes = await getChangelogs(process.runtime.helpers.getOriginGit(), argv.to, argv.from)
            console.log(changes)
        }
    }
]