const constables = require('./constables')
const open = require('open')

module.exports = [
    {
        on: "fatalCrash",
        do: () => {
            const file = constables.fatalCrashLogFile
            const now = new Date()
            const err = `
            --------------------
            \n
            🆘 >> [${now.toLocaleDateString()} ${now.toLocaleTimeString()}]
            \n\t ${error.stack}
            \n
            --------------------\n
            `
        
            fs.appendFileSync(file, err, { encoding: "utf-8" })
        
            console.log(`[🛑 FATAL CRASH] > ${error.message}`)
            console.log(`🗒  Open '${file}' for more details >> ${file}`)
        
            try {
                open(file)
            } catch (error) {
                // fatality, something is really broken ._.
            }
        } 
    },
    {
        on: "addons_initialization_start",
        do: () => {
            process._addons_initialization_spinner = require("./libs/cli-spinner").default('Loading addons').start()
        }
    },
    {
        on: "addons_initialization_done",
        do: () => {
            if (typeof process._addons_initialization_spinner !== "undefined") {
                process._addons_initialization_spinner.stop()
                delete process._addons_initialization_spinner
            }
        }
    }
]