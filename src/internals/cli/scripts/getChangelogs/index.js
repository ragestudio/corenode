const { htmlEscape } = require('escape-goat')
const git = require('@corenode/git-lib')

function getChangelogs (url, to, from) {
    if (!url) {
        throw new Error(`Please provide an git url`)
    }

    const latest = git.latestTagOrFirstCommit()
    const log = git.commitLogBetweenTags((from ?? latest), to)

    if (!log) {
        throw new Error(`Get changelog failed, no new commits was found.`)
    }

    const commits = log.split('\n').map((commit) => {
        const splitIndex = commit.lastIndexOf(' ')
        return {
            message: commit.slice(0, splitIndex),
            id: commit.slice(splitIndex + 1),
        }
    })

    return commits.map((commit) => `- ${htmlEscape(commit.message)}  ${commit.id}`).join('\n')
}

module.exports = getChangelogs