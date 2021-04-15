import path from 'path'
import fs from 'fs'

export function listAllFiles(dir) {
    return fs.readdirSync(dir).reduce((list, file) => {
        const name = path.join(dir, file)
        const isDir = fs.statSync(name).isDirectory()

        return list.concat(isDir ? listAllFiles(name) : [name])
    }, [])
}

export function getBuilderEnv() {
  const envFile = path.resolve(process.cwd(), '.builder')

  return JSON.parse(fs.readFileSync(envFile, 'utf-8'))
}