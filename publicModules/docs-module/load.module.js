module.exports = {
    pkg: "corenode_docs",
    script: "./dist/index.js",
    appendCli: [
        {
            command: "gendocs",
            exec: (context) => {
                console.log(context)
                //exec: (argv) => require("./dist/index.js").default(argv)
            }
        }
    ],
}