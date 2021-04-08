module.exports = {
    pkg: "corenode_docs",
    init: (libraries) => {
        const { builtIn } = libraries
        const { cli } = builtIn
        cli.add({
            command: 'gendocs',
            description: "Generate project documentation",
            exec: (argv) => require("./dist/index.js").default(argv)
        })
    }
}