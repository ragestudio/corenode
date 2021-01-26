module.exports = {
    pkg: "nodecore_docs",
    init: (libraries) => {
        const { builtIn } = libraries
        const { cli } = builtIn
        cli.add({
            command: 'docs',
            description: "Run proyect test",
            exec: (argv) => require("./dist/index.js").default(argv)
        })
    }
}