import { __installPackage, __installCore, __initCreateRuntime, releaseProyect } from './scripts'
import outputLog from './utils/outputLog'

import buildProyect from '@nodecorejs/builder'
import { objectToArrayMap, cliRuntime, verbosity } from '@nodecorejs/utils'
import { getRuntimeEnv, getVersion, bootstrapProyect, bumpVersion } from '@nodecorejs/dot-runtime'

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
            const discriminators = ["bump-mayor", "bump-minor", "bump-patch", "alpha", "beta", "nightly", "release"]
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
                console.log(`🏷 Using current version v${getVersion()}`)
            }
        }
    },
    {
        command: 'release',
        description: "Release this current development proyect",
        exec: (argv) => {
            releaseProyect()
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