import { __installPackage, __installCore, __initCreateRuntime, releaseProyect, bootstrapProyect } from './scripts'
import { getChangelogs } from './scripts/utils'

import buildProyect from '@nodecorejs/builder'
import cliRuntime from './cliRuntime'

import { getVersion, bumpVersion, syncPackageVersionFromName, getGit, getRootPackage, isLocalMode, syncAllPackagesVersions } from '@nodecorejs/dot-runtime'

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
        command: 'add [package] [dir]',
        description: "Install an nodecore package from std",
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

                __installCore(opts)
            } else {
                console.log(`⛔️ Nothing to install! No package defined`)
            }
        }
    },
    {
        command: 'version',
        description: "Show current build version or update/bump version",
        args: (yargs) => {
            yargs.positional('bump-minor', {
                describe: 'Bump version'
            }),
                yargs.positional('bump-mayor', {
                    describe: 'Bump version'
                }),
                yargs.positional('bump-patch', {
                    describe: 'Bump version'
                })
        },
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
                if (argv.engine) {
                    return console.log(`⚙️  NodecoreJS v${getVersion(true)}${isLocalMode()? "@local" : ""}`)
                }
                const proyectPkg = getRootPackage()
                console.log(`🏷  ${proyectPkg.name ?? ""} v${getVersion(argv.engine)}`)
            }
        }
    },
    {
        command: 'release',
        description: "Release this current development proyect",
        exec: (argv) => {
            releaseProyect({
                minor: argv.bumpMinor ?? false,
                next: argv.minor ?? false,
                publishNpm: argv.npm ?? false,
                preRelease: argv.preRelease ?? false,
                skipGitStatusCheck: argv.skipGit ?? false,
                publishOnly: argv.publishOnly ?? false,
                skipBuild: argv.skipBuild ?? false
            })
        }
    },
    {
        command: 'build',
        description: "Build this current development proyect with nodecore/builder",
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
        description: "Run bootstraper for this current development proyect",
        exec: (argv) => {
            bootstrapProyect(argv).then((res) => {
                console.log(`\n✅ DONE\nAll modules bootstraped > ${res}\n`)
            })
        }
    },
    {
        command: 'sync [package]',
        description: "Sync proyect versions",
        exec: (argv) => {
            if (!argv.package) {
                return syncAllPackagesVersions()
            }
            return syncPackageVersionFromName(argv.package, argv.write)
        }
    },
    {
        command: 'changelogs',
        description: "Print changelogs from this proyect",
        exec: async (argv) => {
            const changes = await getChangelogs(getGit())
            console.log(`\n`,changes(''))
        }
    },
    {
        command: 'init',
        description: "Initialize an new nodecore development proyect",
        exec: (argv) => {
            __initCreateRuntime()
        }
    },
]


cliRuntime({
    options: optionsMap,
    commands: commandMap
})