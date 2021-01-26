import { verbosity } from '@nodecorejs/utils/src'
import Listr from 'listr'

export async function publishProyect(args) {
    let config = {
        nodecoreModule: false,
        publishNpm: false,
        preRelease: false,
        next: false,
        skipGitStatusCheck: false,
        publishOnly: false,
        skipBuild: false,
        minor: false,
    }

    if (typeof (args) !== "undefined") {
        config = { ...config, ...args }
    }

    let tasks = [
        {
            title: "📝 Checking git status",
            task: () => {

            }
        },
        {
            title: "📈 Generating changelogs",
            task: () => {

            }
        },
        {
            title: "📦 Building proyect",
            task: () => {

            }
        },
        {
            title: "🔄 Syncing versions",
            task: () => {

            }
        },
        {
            title: "📢 Publishing",
            task: () => {

            }
        },

    ]

    const list = new Listr(tasks, { collapse: false })
    list.run()
        .then((response) => {
            console.log(`✅ Publish done`)
        })
        .catch((error) => {
            verbosity.error(`Publish failed due a task error > `, error.message)
        })
}