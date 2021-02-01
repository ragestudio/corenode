import fs from 'fs'
import path from 'path'

export function readRootDirectorySync(dir, params) {
    let names = []
    const parentPath = path.resolve((params?.cwd ?? process.cwd()), dir ?? "")

    if (fs.existsSync(parentPath)) {
        let paths = fs.readdirSync(parentPath)

        if (params?.dotFilter ?? true) {
            paths = paths.filter((_path) => _path.charAt(0) !== '.')
        }
        paths.forEach((_path) => {
            if (params?.fullPath ?? false) {
                return names.push(path.resolve(parentPath, _path))
            }
            return names.push(_path)
        })
    }
    return names
}

export default readRootDirectorySync