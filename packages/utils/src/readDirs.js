import fs from 'fs'
import path from 'path'

export function readDirs(origin) {
    origin = path.resolve(origin)
    let dirs = []

    function read(dir) {
        let dirs = []

        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((innerDir) => {
                innerDir = path.resolve(dir, innerDir)

                if (fs.lstatSync(innerDir).isDirectory()) {
                    dirs.push(innerDir)
                }
            })
        }

        return dirs
    }

    read(origin).forEach((dir) => {
        dirs.push(dir)

        const innerDirs = readDirs(dir)
        if (innerDirs.length > 0) {
            dirs.push(...innerDirs)
        }
    })

    return dirs
}

export default readDirs