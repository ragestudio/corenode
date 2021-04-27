const moduleFile = require("../dist/index.js")

module.exports = {
    pkg: "next-module",
    init: (lib) => {
        const { cli } = lib.builtIn
        cli.add({
            command: "next-dev",
            exec: () => {
                console.log("Starting Next.JS development server...")
            }
        })
    }
}