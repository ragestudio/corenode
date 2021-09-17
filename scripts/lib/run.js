/* eslint-disable no-console */
const { spawn } = require("child_process")

function run(command) {
  console.log(`> ${command}`)

  return new Promise((resolve, reject) => {
    const childProcess = spawn("/bin/bash", ["-c", command], { stdio: "inherit" })
    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed: ${command}`))
      }
    })
  })
}


module.exports = run