module.exports = {
    pkg: "dev",
    script: "./addon/index.js",
    ignoreDependencies: true,
    appendCli: [
        {
            command: "dev [file]",
            exec: (context, args) => {
                const script = context.machine.dispatcher()

                if (!args.file) {
                    // exit
                    return false
                }

                script.watch({ file: args.file })
            }
        }
    ],
    dependencies: {
        "@ragestudio/cloudlink": "0.5.2"
    }
}