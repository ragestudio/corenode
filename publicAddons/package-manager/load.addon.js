module.exports = {
    pkg: "package-manager",
    script: "./src/index.js",
    appendCli: [
        {
            command: "install [pkg]",
            description: "Install dependencies",
            exec: (context, args) => {
                const script = context.machine.dispatcher()
                
                if (args.pkg) {
                    script.installDependency({ pkg: args.pkg })
                }
            }
        },
    ]
}