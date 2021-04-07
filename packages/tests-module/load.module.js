module.exports = {
    pkg: "nodecore_test",
    init: (libraries) => {
        const { builtIn } = libraries
        const { cli } = builtIn
        cli.add({
            command: 'test',
            description: "Run project test",
            exec: (argv) => require("./dist/index.js").default(argv)
        })
    }
}