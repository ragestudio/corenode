const babel = require("@babel/core")

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

const ignoredSources = env.ignore
const skipedSources = env.skip
const maximunLenghtErrorShow = (Number(process.stdout.columns) / 2) - 10

function handleError(err, index, dir) {
  // if (multibar && !packages[index]) {
  //   multibar.remove(tasks[packages[index]])
  // }
  builderErrors.push({ task: index, message: err, dir: dir })
}

function getBabelConfig() {
  let config = {
    presets: [
      [
        require.resolve('@babel/preset-typescript'),
        {},
      ],
      [
        require.resolve('@babel/preset-env'),
        {
          targets: {
            node: 6
          }
        },
      ],
    ],
    plugins: [
      require.resolve('@babel/plugin-transform-runtime'),
      require.resolve('@babel/plugin-proposal-export-default-from'),
      require.resolve('@babel/plugin-proposal-do-expressions'),
      require.resolve('@babel/plugin-proposal-class-properties'),
    ],
  }

  if (env) {
    config = { ...config, ...env }
  }

  return config
}

//  >> MAIN <<
const outExt = '.js'
const fileExtWatch = ['.js', '.ts']
const babelConfig = getBabelConfig() // global config

function canRead(dir) {
  try {
    fs.accessSync(dir)
    return true
  } catch (error) {
    return false
  }
}

function babelTransform(contents, filepath) {
  return new Promise((resolve, reject) => {
    try {
      babel.transform(contents, { ...babelConfig, filename: filepath }, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    } catch (error) {
      return reject(error)
    }
  })
}

export function build({ dir, opts, ticker }) {
  return new Promise((resolve, reject) => {
    let options = {
      outDir: 'dist'
    }

    if (typeof (opts) !== "undefined") {
      options = { ...options, ...opts }
    }

    const src = path.resolve(dir, `src`)
    const out = path.resolve(dir, options.outDir)

    const sources = [
      path.join(src, '**/*'),
      `!${path.join(src, '**/*.test.js')}`,
    ]

    if (ignoredSources.length > 0) {
      ignoredSources.forEach((source) => {
        sources.push(`!${path.resolve(source)}`)
      })
    }

    function handleTicker() {
      try {
        if (typeof (ticker) == "function") ticker()
      } catch (error) {
        // terrible
      }
    }

    try {
      if (fs.existsSync(out)) {
        rimraf.sync(out)
      }

      const stream = vfs.src(sources, {
        allowEmpty: false
      })
        .pipe(through.obj((file, codec, callback) => {

          if (ignoredSources.includes(path.resolve(file.path))) {
            handleTicker()
            console.log(file.path)
            return callback(null, file)
          }

          if (!path.extname(file.path)) {
            const oldFilepath = file.path
            file.path = `${file.path}/index${outExt}`

            if (fs.existsSync(file.path) && !canRead(file.path)) {
              file.path = `${oldFilepath}/${path.basename(oldFilepath)}`
            }
          }

          if (fileExtWatch.includes(path.extname(file.path))) {
            babelTransform(file.contents, file.path)
              .then((_output) => {
                file.contents = Buffer.from(_output.code)
                file.path = file.path.replace(path.extname(file.path), outExt)

                handleTicker()
                return callback(null, file)
              })
              .catch((err) => {
                handleError(err.message, 0, file.path)

                handleTicker()
                return callback(null, file)
              })
          } else {
            // simply ignore and return callback for copy file
            return callback(null, file)
          }
        }))
        .pipe(vfs.dest(out))

      stream.on('end', () => {
        return resolve(true)
      })
    } catch (error) {
      return reject(error)
    }
  })
}

export function buildProject(opts) {
  return new Promise((resolve, reject) => {
    const packagesPath = path.join(process.cwd(), 'packages')
    const isProjectMode = fs.existsSync(packagesPath)
    const tasks = {}

    const cliEnabled = opts?.cliui ? true : false
    const multibarEnabled = cliEnabled

    let builderCount = Number(0)
    let multibar = null

    let packages = isProjectMode ? fs.readdirSync(packagesPath).filter((dir) => dir.charAt(0) !== '.') : ["./"]

    let dirs = packages.map((name) => {
      return isProjectMode ? `./packages/${name}` : `${name}`
    })

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
        if (multibarEnabled) {
          multibar.stop()
        }

        if (Array.isArray(builderErrors) && builderErrors.length > 0) {
          const pt = new prettyTable()
          const headers = ["TASK INDEX", "⚠️ ERROR", "PACKAGE"]
          const rows = []

          builderErrors.forEach((err) => {
            if (err?.message?.length > maximunLenghtErrorShow) {
              err.message = (String(err.message).slice(0, (maximunLenghtErrorShow - 3)) + "...")
            }
            if (err?.dir?.length > maximunLenghtErrorShow) {
              err.dir = (String(err.dir).slice(0, (maximunLenghtErrorShow - 3)) + "...")
            }
            rows.push([err.task ?? "UNTASKED", err.message ?? "Unknown error", err.dir ?? "RUNTIME"])
          })

          pt.create(headers, rows)

          console.log(`\n\n ⚠️  ERRORS / WARNINGS FOUND DURING BUILDING`)
          pt.print()
        }
        return resolve()
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
          const packagePath = path.resolve(process.cwd(), `${dir}/src`)
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