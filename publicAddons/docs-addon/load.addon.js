module.exports = {
    pkg: "docs",
    script: "./dist/index.js",
    appendCli: [
        {
            command: "gendocs",
            exec: (context) => {
                require("./dist/index.js").default(argv)
            }
        }
    ],
}