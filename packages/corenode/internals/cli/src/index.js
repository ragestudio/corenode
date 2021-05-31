const helpers = process.runtime.helpers

import { publishProject, bootstrapProject, getChangelogs } from './scripts'
import { prettyTable, objectToArrayMap } from '@corenode/utils'
import generateCli from './genCli'

let optionsMap = [
    {
        option: "clearBefore",
        description: "Clear console before print",
        alias: ["cb"],
        type: "boolean",
        exec: () => {
            console.clear()
        }
    },
]

let commandMap = [
    {
        command: 'addons [action] [addon]',
        description: "Manage runtime addons",
        exec: (argv) => {
            switch (argv.action) {
                case ("install"): {
                    break
                }
                case ("remove"): {
                    break
                }
                default: {
                    const allAddons = process.runtime.addons.getLoadedAddons()
                    const pt = new prettyTable()

                    let headers = ["addon", "_runtimed", "directory"]
                    let rows = []
                    
                    allAddons.forEach((addon) => {
                        const loader = process.runtime.addons.loaders[addon]

                        const isRuntimed = loader.internal ?? false
                        const key = loader.pkg
                        const cwd = loader.file

                        rows.push([`${isRuntimed ? `⚙️ ` : `📦 `} ${key}`, `${isRuntimed}`, cwd])
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
                if (argv.sync) {
                    helpers.syncAllPackagesVersions()
                }
            } else {
                const engineVersion = helpers.getVersion({ engine: true })
                const proyectVersion = helpers.getVersion()

                const projectPkg = helpers.getRootPackage()
                const pt = new prettyTable()

                let headers = ["", "🏷  Version", "🏠  Directory"]
                let rows = []

                if (argv.engine) {
                    rows.push(["Corenode™", `v${engineVersion}${helpers.isCorenodeProject() ? "@local" : ""}`, __dirname])
                }

                proyectVersion ? rows.push([`📦  ${projectPkg.name ?? "Unnamed"}`, `v${proyectVersion}`, process.cwd()]) : console.log("🏷  Version not available")

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
        exec: (argv) => {
            publishProject(argv)
        }
    },
    {
        command: 'build',
        description: "Build project with builtin builder",
        exec: (argv) => {
            require("@corenode/builder").buildProject({
                cliui: argv.silent ? false : true,
                from: argv.from
            })
                .then(() => {
                    console.log(`✅  DONE`)
                })
        }
    },
    {
        command: 'bootstrap',
        description: "Bootstrap all packages",
        exec: (argv) => {
            bootstrapProject(argv)
                .then((res) => {
                    console.log(`\n✅ DONE\nAll packages bootstraped > ${res}\n`)
                })
        }
    },
    {
        command: 'sync [package]',
        description: "Sync project versions",
        exec: (argv) => {
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
            const changes = await getChangelogs(helpers.getGit(), argv.to, argv.from)
            console.log(changes)
        }
    },
    {
        command: "env",
        description: "Show current runtime enviroment",
        exec: () => {
            console.log(global._env)
        }
    }
]

export function runCli() {
    generateCli({
        options: optionsMap,
        commands: commandMap
    })
}

runCli()