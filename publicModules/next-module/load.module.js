module.exports = {
    pkg: "next-module",
    script: "./dist/index.js",
    appendCli: [
        {
            command: "next-dev",
            exec: (context) => {
                const script = context.script.dispatcher()

                console.log("Starting Next.JS development server...")
                script.initApp()
            }
        }
    ]
}