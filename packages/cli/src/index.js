import { __installPackage, __installCore, __initCreateRuntime, releaseProyect } from './scripts'
import bootstrapProyect from './scripts/bootstrapProyect'

import outputLog from './utils/outputLog'
import { getChangelogs } from './utils/getChangelogs'

import buildProyect from '@nodecorejs/builder'
import { cliRuntime } from '@nodecorejs/utils'

import { getRuntimeEnv, getVersion, bumpVersion, syncPackageVersionFromName, getGit } from '@nodecorejs/dot-runtime'

const runtimeEnv = getRuntimeEnv()

function __requiredRuntime() {
    if (!runtimeEnv) {
        outputLog.spinner.fail(`runtimeEnv is not present`)
        return process.exit(1)
    }
    if (!runtimeEnv.src) {
        outputLog.spinner.fail(`(src) is not defined on runtimeEnv file`)
        return process.exit(1)
    }
    if (runtimeEnv.remoteSource) {
        return outputLog.spinner.warn(`remoteSource is not provided! Using fallback`)
    }
}

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
                console.log(`🏷 Using current version v${getVersion(argv.engine)}`)
            }
        }
    },
    {
        command: 'release',
        description: "Release this current development proyect",
        exec: (argv) => {
            releaseProyect({
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
            console.log(`🔄 Starting builder...`)
            buildProyect(argv)
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
        command: 'syncversion [package]',
        description: "Sync current version to package",
        exec: (argv) => {
            syncPackageVersionFromName(argv.package, argv.write)
        }
    },
    {
        command: 'changelogs',
        description: "Print changelogs from this proyect",
        exec: async (argv) => {
            const changes = await getChangelogs(getGit())
            console.log(changes())
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