const { verbosity } = require("../packages/utils/dist")

verbosity.log("normal bruh")

function bruhTest(params) {
    verbosity.options({ line: true, file: true }).log("bruh")
}

bruhTest()
