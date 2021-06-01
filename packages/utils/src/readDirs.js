import fs from 'fs'
import path from 'path'

export function readAllDirs(origin, maxDepth) {
    origin = path.resolve(origin)

    function read(dir, depth) {
        depth += 1
        let dirs = []

        if (typeof maxDepth !== "undefined") {
            if (depth >= maxDepth) {
                return []
            }
        }

        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((innerDir) => {
                innerDir = path.resolve(dir, innerDir)

                if (fs.lstatSync(innerDir).isDirectory()) {
                    dirs.push(innerDir)

                    read(innerDir, depth).forEach((innerDir) => {
                        dirs.push(innerDir)
                    })
                }
            })
        }

        return dirs
    }

    return read(origin, 0)
}

export default readAllDirs