module.exports = {
    pkg: "tests",
    appendCli: [
        {
            command: "tests",
            description: "Run project test",
            exec: (context, args) => {
                require("./dist/index.js").default(args)
            }
        }
    ]
}