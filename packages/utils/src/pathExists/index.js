import fs from 'fs'

export default async (path) => {
    try {
        await fs.promises.access(path)
        return true
    } catch {
        return false
    }
}