
import path from 'path'
import fs from 'fs'
import cliProgress from 'cli-progress'

import { prettyTable } from '@corenode/utils'

import rimraf from 'rimraf'
import vfs from 'vinyl-fs'
import through from 'through2'

import * as lib from './lib'

let env = {}
let builderErrors = Array()

try {
  env = lib.getBuilderEnv()
} catch (error) {
  handleError(error.message)
}

let ignoredSources = env.ignore ?? []
let skipedSources = env.skip ?? []

const maximunLenghtErrorShow = (Number(process.stdout.columns) / 2) - 10

function handleError(err, index, dir) {
  // if (multibar && !packages[index]) {
  //   multibar.remove(tasks[packages[index]])
  // }
  builderErrors.push({ task: index, message: err, dir: dir })
}

//  >> MAIN <<
const outExt = '.js'
const fileExtWatch = ['.js', '.ts']

function canRead(dir) {
  try {
    fs.accessSync(dir)
    return true
  } catch (error) {
    return false
  }
}

export function build(payload) {
  return new Promise((resolve, reject) => {
    let { dir, opts, ticker } = payload
    let options = {
      outDir: 'dist',
      agent: 'babel' // default
    }

    if (typeof (opts) !== "undefined") {
      options = { ...options, ...opts }
    }

    const src = path.resolve(options.from, `${dir}/src`)
    const out = path.resolve(options.from, `${dir}/${options.outDir}`)
    
    const sources = [
      path.join(src, '**/*'),
      `!${path.join(src, '**/*.test.js')}`,
    ]

    function handleTicker() {
      try {
        if (typeof (ticker) == "function") ticker()
      } catch (error) {
        // terrible
      }
    }

    if (fs.existsSync(out)) {
      rimraf.sync(out)
    }

    try {
      const stream = vfs.src(sources, {
        allowEmpty: true
      })
        .pipe(through.obj((file, codec, callback) => {
          function passThrough() {
            handleTicker()
            return callback(null, file)
          }

          if (!path.extname(file.path)) {
            if (canRead(file.path)) {
              return passThrough()
            }

            const oldFilepath = file.path
            file.path = `${file.path}/index${outExt}`

            if (fs.existsSync(file.path) && !canRead(file.path)) {
              file.path = `${oldFilepath}/${path.basename(oldFilepath)}`
            }
          }

          if (skipedSources.includes(path.resolve(file.path))) {
            return passThrough()
          }

          if (fileExtWatch.includes(path.extname(file.path))) {
            lib.agents[options.agent](file.contents, file.path, env)
              .then((_output) => {
                file.contents = Buffer.from(_output.code)
                file.path = file.path.replace(path.extname(file.path), outExt)

                return passThrough()
              })
              .catch((err) => {
                handleError(err.message, 0, path.basename(file.path))

                return passThrough()
              })
          } else {
            // ignore and return callback for stream file
            handleError(`[${path.extname(file.path)}] type extension not included, ignoring...`, 0, path.basename(file.path))
            return passThrough()
          }
        }))
        .pipe(vfs.dest(out))

      stream.on('end', () => {
        return resolve(true)
      })

      stream.on('error', (err) => {
        return reject(err)
      })

    } catch (error) {
      return reject(error)
    }
  })
}

export function buildProject(opts) {
  return new Promise((resolve, reject) => {
    const tasks = {}

    const cliEnabled = opts?.cliui ? true : false
    const multibarEnabled = cliEnabled

    const from = opts.from = opts?.from ?? process.cwd()
    const packagesPath = path.resolve(from, 'packages')
    const isProjectMode = fs.existsSync(packagesPath)
    
    let builderCount = Number(0)
    let multibar = null

    let packages = isProjectMode ? fs.readdirSync(packagesPath).filter((dir) => dir.charAt(0) !== '.') : ["./"]

    if (skipedSources.length > 0) {
      skipedSources = skipedSources.map((source) => {
        return path.resolve(source)
      })
    }

    if (ignoredSources.length > 0) {
      ignoredSources.forEach((source) => {
        packages = packages.filter(pkg => pkg !== source)
      })
    }

    let dirs = packages.map((name) => {
      return isProjectMode ? `./packages/${name}` : `${name}`
    })

    function handleFinish() {
      if (multibarEnabled) {
        multibar.stop()
      }

      if (Array.isArray(builderErrors) && builderErrors.length > 0) {
        const pt = new prettyTable()
        const headers = ["TASK INDEX", "⚠️ ERROR", "PACKAGE"]
        const rows = []

        builderErrors.forEach((err) => {
          let obj = { ...err }

          if (obj?.message?.length > maximunLenghtErrorShow) {
            obj.message = (String(obj.message).slice(0, (maximunLenghtErrorShow - 3)) + "...")
          }
          if (obj?.dir?.length > maximunLenghtErrorShow) {
            obj.dir = (String(obj.dir).slice(0, (maximunLenghtErrorShow - 3)) + "...")
          }
          rows.push([obj.task ?? "UNTASKED", obj.message ?? "Unknown error", obj.dir ?? "RUNTIME"])
        })

        pt.create(headers, rows)

        console.log(`\n⚠️  ERRORS / WARNINGS DURING BUILDING`)
        pt.print()
      }

      resolve()
    }

    function handleTicker(index) {
      if (multibarEnabled) {
        tasks[packages[index]].increment(1)
      }
    }

    function handleThen(index) {
      if (typeof (index) == "undefined") {
        return reject(`handleThen index not defined!`)
      }

      builderCount += 1

      if (multibarEnabled) {
        const task = tasks[packages[index]]
        const currentValue = task.value
        const totalValue = task.total

        if (currentValue != totalValue) {
          task.setTotal(currentValue)
        }
      }

      if (builderCount == (packages.length - 1)) {
        handleFinish()
      }
    }

    // >> MAIN <<
    try {
      if (cliEnabled) {
        if (multibarEnabled) {
          multibar = new cliProgress.MultiBar({
            forceRedraw: false,
            stopOnComplete: true,
            barsize: 20,
            clearOnComplete: false,
            hideCursor: true,
            format: '[{bar}] {percentage}% | {filename} | {value}/{total}'
          }, cliProgress.Presets.shades_grey)
        }

      }
    } catch (error) {
      handleError(error, "UNTASKED", "CLI INIT")
    }

    dirs.forEach((dir, index) => {
      try {
        if (multibar && multibarEnabled) {
          const packagePath = path.resolve(opts?.from ?? process.cwd(), `${dir}/src`)
          const sources = lib.listAllFiles(packagePath).length

          tasks[packages[index]] = multibar.create(sources, 0)
          tasks[packages[index]].update(0, { filename: packages[index] })
        }
      } catch (error) {
        console.log(error)
        // terrible
      }

      // start builder
      build({ dir, opts, ticker: () => handleTicker(index) })
        .then((done) => {
          handleThen(index)
        })
        .catch((err) => {
          if (Array.isArray(err)) {
            err.forEach((error) => {
              handleError(error.message, index, dir)
            })
          } else {
            handleError(`${err}`, index, dir)
          }

        })
    })

  })
}

export default buildProject