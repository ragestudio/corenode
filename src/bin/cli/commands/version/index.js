const { prettyTable } = require("@corenode/utils")

module.exports = {
    command: 'version',
    description: "Manage project version",
    options: ["--engine"],
    exec: (opts) => {
        const helpers = process.runtime.helpers

        const engineVersion = helpers.getVersion({ engine: true })
        const projectVersion = helpers.getVersion()

        const projectPkg = helpers.getRootPackage()
        const pt = new prettyTable()

        let headers = ["", "🏷  Version", "🏠  Directory"]
        let rows = []

        if (opts.engine) {
            rows.push(["Corenode™", `v${engineVersion}${helpers.isCorenodeProject() ? "@local" : ""}`, __dirname])
        }

        projectVersion ? rows.push([`📦  ${projectPkg.name ?? "Unnamed"}`, `v${projectVersion}`, process.cwd()]) : console.log("🏷  Version not available")

        if (rows.length > 0) {
            pt.create(headers, rows)
            pt.print()
        }
    }
}