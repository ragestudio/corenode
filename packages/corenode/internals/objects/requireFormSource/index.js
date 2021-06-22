const path = require('path')
const fs = require('fs')

module.exports = {
    thing(key, options) {
        if (typeof key !== "string") {
            throw new Error(`Invalid script type, expected (string)`)
        }
    
        function getTarget(from, key) {
            const tree = key.split("/")
            const hasTree = tree.length > 1
    
            if (hasTree) {
                const first = tree[0]
                const rest = tree.splice(1, key.length).join("/")
    
                return path.join(cwd, first, from, rest)
            } else {
                return path.join(cwd, key, from)
            }
        }
    
        const hasPackages = runtime.helpers.isProjectMode()
        const cwd = hasPackages ? path.resolve(process.cwd(), "packages") : process.cwd()
    
        const distPath = hasPackages ? getTarget("dist", key) : path.join(cwd, "dist")
        const sourcePath = hasPackages ? getTarget("src", key) : path.join(cwd, "src")
    
        const hasDist = options.noDist ? false : fs.existsSync(distPath)
        const target = hasDist ? distPath : sourcePath
    
        return require(target)
    }
}