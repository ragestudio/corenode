const { publish, bootstrapProject, getChangelogs } = require("./scripts")
const { prettyTable } = require("@corenode/utils")

module.exports = [
    {
        command: 'addons',
        arguments: ["[action]", "[addon]"],
        description: "Manage runtime addons",
        exec: (arg1, arg2) => {
            if (!process.runtime.initialized) {
                process.runtime.initialize()
            }
       
            switch (arg1) {
                case ("install"): {
                    console.log("Installing addons... >", arg2)
                    break
                }
                case ("remove"): {
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
        command: 'version',
        description: "Manage project version",
        exec: (argv) => {
            const helpers = process.runtime.helpers
            let bumps = []
            const types = ["bump-mayor", "bump-minor", "bump-patch"]
            types.forEach((bump) => {
                const parsedBump = bump.split('-')[1]
                if (argv[bump]) {
                    if (!parsedBump) {
                        return bumps.push(bump)
                    }
                    bumps.push(parsedBump)
                }
            })

            if (bumps.length > 0) {
                helpers.bumpVersion(bumps)
                helpers.syncVersions()
            } else {
                const engineVersion = helpers.getVersion({ engine: true })
                const projectVersion = helpers.getVersion()

                const projectPkg = helpers.getRootPackage()
                const pt = new prettyTable()

                let headers = ["", "🏷  Version", "🏠  Directory"]
                let rows = []

                if (argv.engine) {
                    rows.push(["Corenode™", `v${engineVersion}${helpers.isCorenodeProject() ? "@local" : ""}`, __dirname])
                }

                projectVersion ? rows.push([`📦  ${projectPkg.name ?? "Unnamed"}`, `v${projectVersion}`, process.cwd()]) : console.log("🏷  Version not available")

                if (rows.length > 0) {
                    pt.create(headers, rows)
                    pt.print()
                }
            }
        }
    },
    {
        command: 'publish',
        description: "Publish this current project",
        options: ["--noTasks"],
        exec: (argv) => {
            console.log(argv)
            return 
            publish(argv)
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
        command: 'build [from]',
        description: "Build project with builtin builder",
        exec: (argv) => {
            require("../builder/cli")
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