import { getVersion, bumpVersion, syncPackageVersionFromName, getGit, getRootPackage, iscorenodeProject, syncAllPackagesVersions } from 'corenode'
import { installCore, publishProject, bootstrapProject } from './scripts'
import { getChangelogs } from './scripts/utils'

import { prettyTable, objectToArrayMap } from '@corenode/utils'
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
                    const { unlinkModule } = require("corenode")
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
                    const allModules = process.runtime[0].modules.getLoadedModules()
                    const pt = new prettyTable()

                    let headers = ["module", "_runtimed", "directory"]
                    let rows = []

                    console.log(`\n🔗  All modules loaded :`)
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
        description: "Manage project version",
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
                const projectPkg = getRootPackage()
                const pt = new prettyTable()

                let headers = ["", "🏷  Version", "🏠  Directory"]
                let rows = []

                if (argv.engine) {
                    rows.push(["Corenode™", `v${fetchedVersion}${iscorenodeProject() ? "@local" : ""}`, __dirname])
                }

                fetchedVersion ? rows.push([`📦  ${projectPkg.name ?? "Unnamed"}`, `v${fetchedVersion}`, process.cwd()]) : console.log("🏷  Version not available")

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
        exec: (argv) => publishProject(argv)
    },
    {
        command: 'build',
        description: "Build project with builtin builder",
        exec: (argv) => {
            require("@corenode/builder").default({
                cliui: argv.silent? false : true ?? true
            }).then(() => {
                console.log(`✅  DONE`)
            })
        }
    },
    {
        command: 'bootstrap',
        description: "Bootstrap all packages",
        exec: (argv) => {
            bootstrapProject(argv).then((res) => {
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
                return syncAllPackagesVersions()
            }
            return syncPackageVersionFromName(argv.package, argv.write)
        }
    },
    {
        command: 'changelogs',
        description: "Show the changelogs of this project from last tag",
        exec: async (argv) => {
            const changes = await getChangelogs(getGit(), argv.to, argv.from)
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
                }else {
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
    cliRuntime({
        options: optionsMap,
        commands: commandMap
    })
}

runCli()