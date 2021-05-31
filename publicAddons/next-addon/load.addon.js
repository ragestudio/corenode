module.exports = {
    pkg: "next",
    script: "./src/index.js",
    appendCli: [
        {
            command: "next-dev",
            exec: (context) => {
                const script = context.machine.dispatcher()

                console.log("Starting Next.JS development server...")
                script.initApp()
            }
        }
    ]
}