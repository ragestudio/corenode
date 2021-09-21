import { htmlEscape } from "@corenode/utils"
import execa from 'execa'

export const latestTag = () => {
    const { stdout } = execa.sync('git', ['describe', '--abbrev=0', '--tags'])
    return stdout
}

export const firstCommit = () => {
    const { stdout } = execa.sync('git', [
        'rev-list',
        '--max-parents=0',
        'HEAD',
    ])
    return stdout
}

export const latestTagOrFirstCommit = () => {
    let latest
    try {
        // In case a previous tag exists, we use it to compare the current repo status to.
        latest = latestTag()
    } catch (_) {
        // Otherwise, we fallback to using the first commit for comparison.
        latest = firstCommit()
    }

    return latest
}

export const commitLogBetweenTags = (from, to) => {
    const { stdout } = execa.sync('git', [
        'log',
        '--format=%s %h',
        `${from}..${to ?? "HEAD"}`,
    ])
    return stdout
}

export const commitLogFromTagToHead = (from) => {
    const { stdout } = execa.sync('git', [
        'log',
        '--format=%s %h',
        `${from}..HEAD`,
    ])
    return stdout
}

export function getChangelogs(url, to, from) {
    if (!url) {
        throw new Error(`Please provide an git url`)
    }

    const latest = latestTagOrFirstCommit()
    const log = commitLogBetweenTags((from ?? latest), to)

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

    return commits.map((commit) => `- ${htmlEscape.escape(commit.message)}  ${commit.id}`).join('\n')
}
