function run(context, args) {
    const { runTests } = require("./src")
    runTests(args)
}

runtime.appendToCli({
    command: "test",
    exec: run
})

expose = {
    run
}