module.exports = {
    command: "bump-version",
    description: "Bump version of the project",
    arguments: ["<type...>"],
    exec: (type) => {
        const bumps = []

        type.forEach((bump) => {
            if (!bumps.includes(bump)) {
                bumps.push(bump)
            }
        })

        if (bumps.length > 0) {
            process.runtime.helpers.bumpVersion(bumps)
            process.runtime.helpers.syncVersions()
        }
    },
}