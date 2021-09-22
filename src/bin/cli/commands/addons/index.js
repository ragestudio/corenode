const { prettyTable } = require("@corenode/utils")

module.exports = {
    command: 'addons',
    arguments: ["[action]", "[addon...]"],
    description: "Manage runtime addons",
    exec: async (action, id) => {
        switch (action) {
            case ("install"): {
                if (id.length === 0) {
                    console.error("🛑 Usage: addons install <addon...>")
                }
                // TODO: [install] handle with addons dependencies manager
                break
            }
            case ("remove"): {
                // TODO: [remove] handle with addons dependencies manager
                break
            }
            default: {
                const controller = process.runtime.addonsController

                if (!controller) {
                    return console.log(`!!! Addons controller is not available`)
                }

                const allAddons = controller.getLoadedAddons()
                const pt = new prettyTable()

                let headers = ["addon", "timings", "directory"]
                let rows = []

                allAddons.forEach((addon) => {
                    const loader = controller.loaders[addon]

                    const isRuntimed = loader.internal ?? false
                    const key = loader.pkg
                    const cwd = loader.file

                    rows.push([`${isRuntimed ? `⚙️ ` : `📦 `} ${key} ${loader.disabled ? "(disabled)" : ""}`, loader.timings ? JSON.stringify(loader.timings) : "none", cwd])
                })

                pt.create(headers, rows)
                pt.print()
                break
            }
        }
    }
}