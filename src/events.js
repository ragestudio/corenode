const constables = require('./constables')
const open = require('open')

module.exports = [
    {
        on: "fatalCrash",
        event: () => {
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
]