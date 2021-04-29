module.exports = {
    pkg: "next-module",
    script: "./dist/index.js",
    appendCli: [
        {
            command: "next-dev",
            exec: () => {
                console.log("Starting Next.JS development server...")
            }
        }
    ]
}