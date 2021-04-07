module.exports = {
    pkg: "nodecore_docs",
    init: (libraries) => {
        const { builtIn } = libraries
        const { cli } = builtIn
        cli.add({
            command: 'docs',
            description: "Generate project documentation",
            exec: (argv) => require("./dist/index.js").default(argv)
        })
    }
}