module.exports = {
    pkg: "tests",
    appendCli: [
        {
            command: "tests",
            description: "Run project test",
            exec: (context) => {
                require("./dist/index.js").default(argv)
            }
        }
    ]
}