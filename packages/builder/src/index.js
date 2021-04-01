import path from 'path'
import fs from 'fs'
import cliProgress from 'cli-progress'

import { prettyTable } from '@nodecorejs/utils'

import { spawn, Pool, Worker } from "threads"

let builderErrors = Array()

// const maximunLenghtErrorShow = Number(process.stdout.columns) - 50
const cwd = process.cwd()

function getIgnoredPackages() {
  let ignored = []

  const file = path.resolve(process.cwd(), ".buildIgnore")
  if (fs.existsSync(file)) {
    try {
      ignored = JSON.parse(fs.readFileSync(file, 'utf-8'))
    } catch (error) {
      if (!Array.isArray(builderErrors)) {
        builderErrors = Array()
      }
      builderErrors.push({ message: `Error parsing .buildIgnore > ${error}` })
    }
  }

  return ignored
}

export function buildProject(opts) {
  return new Promise((resolve, reject) => {
    const ignoredPackages = getIgnoredPackages()
    const packagesPath = path.join(cwd, 'packages')
    const isProjectMode = fs.existsSync(packagesPath)

    let count = 0
    let multibar = null

    let packages = isProjectMode ? fs.readdirSync(packagesPath).filter((dir) => dir.charAt(0) !== '.') : ["./"]
    if (Array.isArray(ignoredPackages) && ignoredPackages.length > 0) {
      ignoredPackages.forEach((pkg) => {
         packages = packages.filter(name => name !== pkg)
      })
    }
  
    let dirs = packages.map((name) => {
      return isProjectMode ? `./packages/${name}` : `${name}`
    })
    
    const pool = Pool(() => spawn(new Worker("./build.js")), packages.length)
    const tasks = {}

    function handleThen(index) {
      count += 1

      if (multibar != null) {
        tasks[packages[index]].increment(100)
      }

      if (count == (packages.length - 1)) {
        pool.terminate()

        if (Array.isArray(builderErrors) && builderErrors.length > 0) {
          const pt = new prettyTable()
          const headers = ["TASK INDEX", "⚠️ ERROR", "PACKAGE"]
          const rows = []

          builderErrors.forEach((err) => {
            // if (err?.message?.length > maximunLenghtErrorShow) {
            //   err.message = String(err.message).slice(0, maximunLenghtErrorShow)
            // }
            rows.push([err.task ?? "UNTASKED", err.message ?? "Unknown error", err.dir ?? "RUNTIME"])
          })

          pt.create(headers, rows)

          console.log(`\n\n ⚠️  ERRORS / WARNINGS FOUND DURING BUILDING`)
          pt.print()
        }

        return resolve()
      }
    }

    function handleError(err, index, dir) {
      if (typeof (multibar) != null && !packages[index]) {
        multibar.remove(tasks[packages[index]])
      }
      builderErrors.push({ task: index, message: err, dir: dir })
    }

    if (opts?.cliui) {
      try {
        multibar = new cliProgress.MultiBar({
          forceRedraw: false,
          stopOnComplete: true,
          barsize: "",
          clearOnComplete: false,
          hideCursor: true,
          format: '[{bar}] {percentage}% | {filename} | {value}/{total}'
        }, cliProgress.Presets.shades_grey)
      } catch (error) {
        handleError(error, "UNTASKED", "CLI INIT")
      }
    }

    dirs.forEach((dir, index) => {
      try {
        if (typeof (multibar) != null) {
          let sources = 0
          const packagePath = path.resolve(cwd, dir)

          try {
            sources = fs.readdirSync(packagePath).length
          } catch (error) {
            // terrible
          }

          tasks[packages[index]] = multibar.create(sources, 0)
          tasks[packages[index]].update(0, { filename: packages[index] })
        }
      } catch (error) {

      }

      // console.log(dir, packages[index], Object.keys(tasks)[index])
      const task = pool.queue(builder =>
        builder.builderTask({ dir, opts })
          .catch((err) => handleError(`${err}`, index, dir))
      )

      task.then(() => handleThen(index))
    })
  })
}

export default buildProject