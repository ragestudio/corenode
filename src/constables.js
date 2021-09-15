const path = require("path")

module.exports = {
    // strings
    INVALID_LOCALMODE_FLAG: `⚠️  'LOCAL_BIN' environment flag is enabled, but this project is not allowed to run in local mode, ignoring running in local mode!`,
    USING_LOCALMODE: `🚧  USING LOCAL DEVELOPMENT MODE  🚧`,
    ERROR_EXPORTED: "This error has been exported, check the log file for more details",
    ERROR_PROCESSING_PACKAGE: `❌ Error processing package.json`,
    
    // vars
    fatalCrashLogFile: process.env.fatalCrashLogFile ?? path.resolve(process.cwd(), '.crash.log')
}