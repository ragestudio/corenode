const { runTests } = require("./src")

runtime.appendToCli({
    command: "test",
    exec: (context, args) => {
        runTests(args)
    }
})