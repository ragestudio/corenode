import { stop, performances } from "../performance"

export function outputResume(payload) {
    const { installPath, pkg } = payload || null
    console.group()
    console.log(`\n📦  Installed package (${pkg}) ${installPath ? `on > ${installPath}` : ""}`)
    performances[pkg] ? console.log(`⏱  Operation tooks ${stop(pkg)}ms \n`) : null
    console.groupEnd()
}

export default outputResume