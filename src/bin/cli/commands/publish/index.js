module.exports = {
    command: 'publish',
    description: "Publish this current project",
    options: ["--noTasks", "--ignoreGit", "--npm", "--github", "--fast", "--build", "--preRelease", "--packages", "--ignoreError"],
    exec: (opts) => {
        require("./publish")(opts)
            .then(() => {
                console.log(`\n✅ Publish done`)
            })
            .catch((error) => {
                console.error(error)
                console.error(`\n❌ Publish aborted due an error`)
            })
    }
}