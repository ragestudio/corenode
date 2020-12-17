import { htmlEscape } from 'escape-goat'
import git from '../git'

export const getChangelogs = async (repoUrl, version) => {
    if (!repoUrl) {
        throw new Error(`Please provide an git url`);
    }
    const latest = await git.latestTagOrFirstCommit();
    const log = await git.commitLogFromRevision(latest);

    if (!log) {
        throw new Error(`Get changelog failed, no new commits was found.`);
    }

    const commits = log.split('\n').map((commit) => {
        const splitIndex = commit.lastIndexOf(' ');
        return {
            message: commit.slice(0, splitIndex),
            id: commit.slice(splitIndex + 1),
        };
    });

    return (nextTag) =>
        commits
            .map((commit) => `- ${htmlEscape(commit.message)}  ${commit.id}`)
            .join('\n') + `\n\n${repoUrl}/compare/${latest}...${nextTag}`;
}

export default getChangelogs