module.exports = {
    command: 'sync',
    arguments: ["[packageName]"],
    description: "Sync project versions",
    exec: (packageName) => {
        const helpers = process.runtime.helpers
        console.log(`🔄 Syncing versions...`)

        if (!packageName) {
            return helpers.syncAllPackagesVersions()
        }
        return helpers.syncPackageVersionFromName(packageName, args.write)
    }
}