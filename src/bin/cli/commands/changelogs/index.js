const { getChangelogs } = require('@corenode/git-lib')

module.exports = {
    command: 'changelogs',
    arguments: ["[to]", "[from]"],
    description: "Show the changelogs of this project from last tag",
    exec: async (to, from) => {
        const changes = await getChangelogs(process.runtime.helpers.getOriginGit(), to, from)
        console.log(changes)
    }
}