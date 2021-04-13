const helpers = process.runtime[0].helpers

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
        command: 'modules [action] [module]',
        description: "Manage modules & plugins",
        exec: (argv) => {
            switch (argv.action) {
                case ("install"): {
                    break
                }
                case ("remove"): {
                    break
                }
                default: {
                    const allModules = process.runtime[0].modules.getLoadedModules()
                    const pt = new prettyTable()

                    let headers = ["module", "_runtimed", "directory"]
                    let rows = []

                    objectToArrayMap(allModules).forEach((_module) => {
                        const isRuntimed = _module.value.internal ?? false
                        const key = _module.key
                        const cwd = _module.value.loader

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
        command: 'add [package] [dir]',
        description: "Install an package",
        exec: (argv) => {
            console.log(`⛔️ Nothing to install!`)
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
                helpers.bumpVersion(bumps, argv.save)
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
            require("@corenode/builder").default({
                cliui: argv.silent ? false : true
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
        command: "exec",
        description: "Run builtIn functions on cli mode",
        exec: (argv) => {
            const helpers = require("corenode/dist/helpers")
            const { verbosity } = require("@corenode/utils")

            const args = argv["_"]
            const fn = args[1]
            const context = args.slice(1, args.length)

            try {
                if (typeof (helpers[fn]) == "function") {
                    const _fn = helpers[fn](...context)
                    verbosity.options({ method: `CLI > [${fn}()]` }).log(`>> ${JSON.stringify(_fn)}`)
                } else {
                    console.error(`${fn}() is not an function`)
                }
            } catch (error) {
                console.error(error)
            }
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