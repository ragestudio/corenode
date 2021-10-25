module.exports = {
    command: 'changelogs',
    arguments: ["[to]", "[from]"],
    description: "Show the changelogs of this project from last tag",
    exec: async (to, from) => {
        const lib = require('@corenode/git-lib')
        const changes = await lib.getChangelogs(process.runtime.helpers.getOriginGit(), to, from)
        console.log(changes)
    }
}