import fs from 'fs'
import path from 'path'

function listAllFiles(dir) {
    return fs.readdirSync(dir).reduce((list, file) => {
        const name = path.join(dir, file)
        const isDir = fs.statSync(name).isDirectory()

        return list.concat(isDir ? listAllFiles(name) : [name])
    }, [])
}

export default listAllFiles