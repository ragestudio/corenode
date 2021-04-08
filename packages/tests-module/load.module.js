module.exports = {
    pkg: "corenode_tests",
    init: (libraries) => {
        const { builtIn } = libraries
        const { cli } = builtIn
        cli.add({
            command: 'tests',
            description: "Run project test",
            exec: (argv) => require("./dist/index.js").default(argv)
        })
    }
}