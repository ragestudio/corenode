module.exports = {
    pkg: "next-module",
    init: (lib) => {
        const { cli } = lib.builtIn
        const moduleLib = require("./dist/index.js")

        cli.add({
            command: "next-dev",
            exec: () => {
                console.log("Starting Next.JS development server...")
                moduleLib.init()
            }
        })
    }
}