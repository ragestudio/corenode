module.exports = {
    pkg: "dev",
    script: "./src/index.js",
    appendCli: [
        {
            command: "dev",
            exec: (context) => {
                const script = context.machine.dispatcher()

                console.log("Development")
                console.log(process.yargv)
            }
        }
    ]
}