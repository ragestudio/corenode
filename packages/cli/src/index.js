import { getVersion, bumpVersion, syncPackageVersionFromName, getGit, getRootPackage, isLocalMode, syncAllPackagesVersions } from '@nodecorejs/dot-runtime'
import { installCore, publishProyect, bootstrapProyect } from './scripts'
import { getChangelogs } from './scripts/utils'
import { verbosity } from '@nodecorejs/utils'

import buildProyect from '@nodecorejs/builder'
import cliRuntime from './cliRuntime'

let optionsMap = [
    {
        option: "clearBefore",
        description: "Clear console before print",
        alias: ["cb"],
        type: "boolean",
        exec: (args) => {
            console.clear()
        }
    },
]

let commandMap = [
    {
        command: 'modules [action] [module]',
        description: "Manage nodecore modules & plugins",
        exec: (argv) => {
            switch (argv.action) {
                case ("install"): {
                    const { installModule } = require("./scripts/installModule")
                    installModule({ pkg: argv.module })
                    break
                }
                case ("remove"): {
                    const { unlinkModule } = require("@nodecorejs/modules")
                    // TODO: purge files & data, env templates, registry...etc
                    try {
                        unlinkModule(argv.module, true, true)
                        console.log(`✅  Removed ${argv.module}`)
                    } catch (error) {
                        console.log(`❌  Failed to remove ${argv.module}`)
                    }
                    break
                }
                default: {
                    const { readRegistry } = require("@nodecorejs/modules")
                    const registry = readRegistry({ onlyNames: true })

                    console.table(registry.map((name) => { return { "module": name } }))
                    break
                }
            }
        }
    },
    {
        command: 'add [package] [dir]',
        description: "Install an nodecore package",
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
        description: "Manage global proyect version",
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
                if (argv.engine) {
                    return console.log(`⚙️  NodecoreJS™️  v${fetchedVersion}${isLocalMode() ? "@local" : ""}`)
                }
                const proyectPkg = getRootPackage()
                fetchedVersion ? console.log(`🏷  ${proyectPkg.name ?? ""} v${fetchedVersion}`) : console.log("🏷  Version not available")
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
        description: "Build proyect with built in builder",
        exec: (argv) => {
            console.log(`🔄 Building...`)
            buildProyect({
                buildBuilder: argv.buildBuilder,
                silent: argv.silent
            })
        }
    },
    {
        command: 'bootstrap',
        description: "Bootstrap all packages for this proyect (proyectMode)",
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
        description: "Show the changelogs notes of this proyect",
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