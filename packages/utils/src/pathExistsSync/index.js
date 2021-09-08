import fs from 'fs'

export default (path) => {
    try {
        fs.accessSync(path)
        return true
    } catch {
        return false
    }
}