import { getVersion, bumpVersion, syncPackageVersionFromName, getGit, getRootPackage, isLocalMode, syncAllPackagesVersions } from '@ragestudio/nodecorejs'
import { installCore, publishProyect, bootstrapProyect } from './scripts'
import { getChangelogs } from './scripts/utils'

import { prettyTable, objectToArrayMap } from '@nodecorejs/utils'
import cliRuntime from './cliRuntime'

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
                    const { installModule } = require("./scripts/installModule")
                    installModule({ pkg: argv.module, ...argv })
                    break
                }
                case ("remove"): {
                    const { unlinkModule } = require("@ragestudio/nodecorejs")
                    // TODO: purge files & data, env templates, registry...etc
                    try {
                        unlinkModule(argv.module, { purge: true, write: true })
                        console.log(`✅  Successfuly module removed [${argv.module}]`)
                    } catch (error) {
                        console.log(`❌  Failed to remove module [${argv.module}] >`, error.message)
                    }
                    break
                }
                default: {
                    const { getLoadedModules } = require("@ragestudio/nodecorejs")
                    const registry = getLoadedModules()
                    const pt = new prettyTable()

                    let headers = ["module", "_runtimed", "directory"]
                    let rows = []

                    console.log(`\n🔗  All modules loaded :`)
                    objectToArrayMap(registry).forEach((_module) => {
                        const isRuntimed = _module.value._autoLoaded ?? false
                        const key = _module.key
                        const cwd = _module.value.dir

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
        args: (yargs) => {
            yargs.positional('package', {
                describe: 'Package to install'
            }),
                yargs.positional('dir', {
                    describe: 'Directory to install (default: runtimeDev)'
                })
        },
        exec: (argv) => {
            if (typeof (argv.package) !== "undefined") {
                let opts = {
                    pkg: argv.package
                }

                if (argv.dir) {
                    opts.dir = argv.dir
                }

                installCore(opts)
            } else {
                console.log(`⛔️ Nothing to install!`)
            }
        }
    },
    {
        command: 'version',
        description: "Manage proyect version",
        exec: (argv) => {
            let bumps = []
            const discriminators = ["bump-mayor", "bump-minor", "bump-patch"]
            discriminators.forEach((bump) => {
                const parsedBump = bump.split('-')[1]
                if (argv[bump]) {
                    if (!parsedBump) {
                        return bumps.push(bump)
                    }
                    bumps.push(parsedBump)
                }
            })

            if (bumps.length > 0) {
                bumpVersion(bumps, argv.save)
            } else {
                const fetchedVersion = getVersion(argv.engine)
                const proyectPkg = getRootPackage()
                const pt = new prettyTable()

                let headers = ["", "🏷  Version", "🏠  Directory"]
                let rows = []

                if (argv.engine) {
                    rows.push(["⌬ NodecoreJS™", `v${fetchedVersion}${isLocalMode() ? "@local" : ""}`, __dirname])
                }

                fetchedVersion ? rows.push([`📦  ${proyectPkg.name ?? "Unnamed"}`, `v${fetchedVersion}`, process.cwd()]) : console.log("🏷  Version not available")
                pt.create(headers, rows)
                pt.print()
            }
        }
    },
    {
        command: 'publish',
        description: "Publish this current proyect",
        exec: (argv) => publishProyect(argv)
    },
    {
        command: 'build',
        description: "Build proyect with builtin builder",
        exec: (argv) => {
            console.log(`🔄 Building...`)
            require("@nodecorejs/builder").default({
                buildBuilder: argv.buildBuilder,
                silent: argv.silent
            })
        }
    },
    {
        command: 'bootstrap',
        description: "Bootstrap all packages",
        exec: (argv) => {
            bootstrapProyect(argv).then((res) => {
                console.log(`\n✅ DONE\nAll packages bootstraped > ${res}\n`)
            })
        }
    },
    {
        command: 'sync [package]',
        description: "Sync proyect versions",
        exec: (argv) => {
            console.log(`🔄 Syncing versions...`)
            if (!argv.package) {
                return syncAllPackagesVersions()
            }
            return syncPackageVersionFromName(argv.package, argv.write)
        }
    },
    {
        command: 'changelogs',
        description: "Show the changelogs of this proyect from last tag",
        exec: async (argv) => {
            const changes = await getChangelogs(getGit(), argv.to, argv.from)
            console.log(changes)
        }
    }
]


cliRuntime({
    options: optionsMap,
    commands: commandMap
})