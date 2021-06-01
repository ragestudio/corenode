import fs from 'fs'
import path from 'path'

function listAllFiles(dir, maxDepth) {
    function read(dir, depth) {
        depth += 1

        if (typeof maxDepth !== "undefined") {
            if (depth >= maxDepth) {
                return []
            }
        }

        return fs.readdirSync(dir).reduce((list, file) => {
            const name = path.join(dir, file)
            const isDir = fs.lstatSync(name).isDirectory()
    
            return list.concat(isDir ? read(name, depth) : [name])
        }, [])
    }

    return read(dir, 0)
}

export default listAllFiles