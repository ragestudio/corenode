import path from 'path'
import fs from 'fs'
import cliProgress from 'cli-progress'

import { prettyTable } from '@nodecorejs/utils'

import { spawn, Worker } from "threads"

import rimraf from 'rimraf'
import vfs from 'vinyl-fs'
import through from 'through2'

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

export function transform(content, _path) {
  return new Promise(async (resolve, reject) => {
    const thread = await spawn(new Worker("./build.js"))

    thread.transform(content, _path)
      .then((res) => {
        return resolve(res)
      })
      .catch((err) => {
        return reject(err)
      })

  })
}

export function build({ dir, opts, ticker }) {
  return new Promise((resolve, reject) => {
    let fileCounter = Number(0)
    let options = {
      cwd: process.cwd(),
      outDir: 'dist',
      buildSrc: 'src'
    }

    if (typeof (opts) !== "undefined") {
      options = { ...options, ...opts }
    }

    const buildOut = path.resolve(dir, options.outDir)
    const srcDir = path.resolve(dir, options.buildSrc)

    rimraf.sync(path.resolve(options.cwd, buildOut))

    function createStream(src) {
      return vfs.src([src, `!${path.join(srcDir, '**/*.test.js')}`, `!${path.join(srcDir, '**/*.e2e.js')}`,], {
        allowEmpty: true,
        base: srcDir,
      })
        .pipe(through.obj((f, env, cb) => {
          if (['.js', '.ts'].includes(path.extname(f.path)) && !f.path.includes(`${path.sep}templates${path.sep}`)) {
            transform(f.contents, f.path)
              .then((out) => {
                console.log(out)
                fileCounter += 1
                if (typeof (ticker) == "function") {
                  ticker(fileCounter)
                }

                f.contents = Buffer.from(out.code)
                f.path = f.path.replace(path.extname(f.path), '.js')
              })
              .catch((err) => {
                return reject(err)
              })

          }
          cb(null, f)
        }))
        .pipe(vfs.dest(buildOut))
    }

    const stream = createStream(path.join(srcDir, '**/*'))

    stream.on('end', () => {
      return resolve(fileCounter)
    })
  })
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

    const tasks = {}

    function handleTicker(index, counter) {
      if (multibar != null) {
        tasks[packages[index]].increment(counter)
      }
    }

    function handleThen(index) {
      count += 1

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

      build({ dir, opts })
        .then((done) => handleThen(done))
        .catch((err) => handleError(`${err}`, index, dir))

    })
  })
}

export default buildProject