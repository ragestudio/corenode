const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const { createLogger, format, transports } = require('winston')

const cliProgress = require('cli-progress')
const { prettyTable } = require("@corenode/utils")
const vfs = require('vinyl-fs')
const through = require('through2')

const lib = require('./lib')

const maximunLenghtErrorShow = (Number(process.stdout.columns) / 2) - 10

const fileExtWatch = ['.js', '.ts']
const { combine, timestamp, label, printf } = format

const globalEnv = lib.getBuilderEnv()

function canRead(dir) {
  try {
    fs.accessSync(dir)
    return true
  } catch (error) {
    return false
  }
}

class Builder {
  constructor(params) {
    this.params = { ...params }

    if (typeof this.params.source === "undefined") {
      throw new Error("source not defined!")
    }

    this.silentMode = this.params.silentMode ?? false
    this.showProgressBar = this.params.showProgress ?? false

    this.agent = this.params.agent ?? "babel"

    this.skipSources = Array.isArray(this.params.skipSources) ? this.params.skipSources : []
    this.ticks = Number(0)
    this.fails = []
    this.tasks = []

    // progress bar 
    this.taskBar = null
    this.bars = []

    // init taskbar if requires
    if (!this.silentMode && this.showProgressBar) {
      this.initTaskBar()
    }

    return this
  }

  watch = () => {

  }

  initTaskBar = () => {
    this.taskBar = new cliProgress.MultiBar({
      forceRedraw: false,
      stopOnComplete: true,
      barsize: 20,
      clearOnComplete: false,
      hideCursor: true,
      format: '[{bar}] {percentage}% | {filename} | {value}/{total}'
    }, cliProgress.Presets.shades_grey)
  }

  buildAllSources = () => {
    return new Promise(async (resolve, reject) => {
      let queue = []

      if (Array.isArray(this.params.source)) {
        queue = this.params.source.map(dir => {
          return path.resolve(dir)
        })
      } else {
        queue.push(path.resolve(this.params.source))
      }

      const isOnce = queue.length === 1

      for await (const [index, dir] of queue.entries()) {
        let output = []
        let taskName = undefined

        if (typeof this.params.output !== "undefined") {
          if (Array.isArray(this.params.output)) {
            output.push(this.params.output[index])
          } else {
            output.push(this.params.output)
          }
        } else {
          output.push(dir)
          output.push("../dist")

          if (!isOnce) {
            output.push(path.basename(dir))
          }

          // TODO: (FIX) Deleting the dist folder its causing an read file exception, its async issue with rimraf library
          // check if dist output is already exists and remove it
          // const distDir = path.resolve(output.join("/"))
          // if (fs.existsSync(distDir) && fs.statSync(distDir).isDirectory()) {
          //   await rimraf.sync(distDir)
          // }
        }

        if (typeof this.params.taskName !== "undefined") {
          if (Array.isArray(this.params.taskName)) {
            taskName = this.params.taskName[index]
          } else {
            taskName = this.params.taskName
          }
        }

        const inputPath = path.resolve(dir)
        const outputPath = path.resolve(output.join("/"))

        const _task = this.buildFromDir(inputPath, outputPath, taskName)
          .catch(({ message, task }) => {
            this.handleError(message, taskName ?? path.basename(task), inputPath)
          })

        this.tasks.push(_task)
      }

      Promise.all(this.tasks).then(() => {
        this.onFinish()
        return resolve()
      })

    })
  }

  transform = (content, options = {}) => {
    return lib.agents[options.agent](content, { ...options.env, filename: options.filename })
  }

  getTransformFilePipe = (job) => through.obj((file, codec, callback) => {
    const passThrough = () => {
      this.handleTicker(job)
      return callback(null, file)
    }

    if (!path.extname(file.path)) {
      if (canRead(file.path)) {
        return passThrough()
      }

      const oldFilepath = file.path
      file.path = `${file.path}/index.js`

      if (fs.existsSync(file.path) && !canRead(file.path)) {
        file.path = `${oldFilepath}/${path.basename(oldFilepath)}`
      }
    }

    if (this.skipSources.includes(path.resolve(file.path))) {
      return passThrough()
    }

    if (fileExtWatch.includes(path.extname(file.path))) {
      let babelEnv = {
        filename: file.path,
      }

      // exec babel agent
      this.transform(file.contents, { ...babelEnv, filename: file.path, agent: this.agent })
        .then((_output) => {
          file.contents = Buffer.from(_output.code)
          file.path = file.path.replace(path.extname(file.path), ".js")

          return passThrough()
        })
        .catch((err) => {
          this.handleError(err.message, path.basename(file.path), file.path)
          return passThrough()
        })
    } else {
      // ignore and return callback for stream file
      this.handleError(`Type extension not included, ignoring...`, path.basename(file.path), file.path)
      return passThrough()
    }
  })

  buildFromDir = (input, output, jobName) => {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(input)) {
        return reject({ message: "Input directory does not exist", task: input })
      }

      const isFile = !fs.lstatSync(input).isDirectory()

      const job = jobName ?? path.basename(input)
      const sources = isFile ? [isFile] : lib.listAllFiles(input)

      if (!sources) {
        return reject(`No sources available for [${job}]`, 0, job)
      }

      if (this.taskBar != null) {
        this.bars[job] = this.taskBar.create(sources.length, 0)
        this.bars[job].update(0, { filename: job })
      }

      const customInclude = (globalEnv?.include ?? []).map((pattern) => {
        return pattern
      })

      const customExclude = (globalEnv?.exclude ?? []).map((pattern) => {
        return `!${pattern}`
      })

      const globSource = [
        path.join(input, `**/*`),
        `!${path.join(input, `**/*.test.js`)}`,
        ...customInclude,
        ...customExclude,
      ]

      const stream = vfs.src(globSource, {
        allowEmpty: true
      })

      stream.pipe(this.getTransformFilePipe(job)).pipe(vfs.dest(output))

      stream.on('end', () => {
        return resolve(true)
      })

      stream.on('error', (err) => {
        return reject(err)
      })
    })
  }

  // TODO: Cache hash map
  // cache = () => {

  // }

  handleTicker = (job) => {
    this.ticks += 1

    if (typeof this.bars[job] !== "undefined") {
      const bar = this.bars[job]
      if (bar.value < bar.total) {
        this.bars[job].increment()
      }
    }

    if (typeof this.params.onTick === "function") {
      try {
        this.params.onTick(this.ticks)
      }
      catch (error) {
        // terrible
      }
    }
  }

  dumpLog = (level, err, file) => {
    const logger = createLogger({
      format: combine(
        label({ label: level }),
        timestamp(),
        printf(({ message, label, timestamp }) => {
          switch (label) {
            case "error": {
              return `> ${timestamp} (builder)[error] : ${message}`
            }

            default:
              return `> ${timestamp} ${file ? `[${file}]` : ""} (builder)[${label ?? "log"}] : ${message}`
          }
        })
      ),
      transports: [
        new transports.File({ filename: global.dumpLogsFile ?? "dumps.log" }),
      ],
    })

    logger.info(err)
  }

  handleError = (message, task, file) => {
    const err = { message, task, file }
    this.fails.push(err)
  }

  outputFails = () => {
    if (Array.isArray(this.fails) && this.fails.length > 0) {
      const pt = new prettyTable()
      const headers = ["⚠️ ERROR", "TASK"]
      const rows = []

      this.fails.forEach((err) => {
        let obj = { ...err }

        this.dumpLog("warn", `BUILD ERROR >> [${obj.task}] >> ${obj.message}`, obj.file)

        if (obj.message?.length > maximunLenghtErrorShow) {
          obj.message = (String(obj.message).slice(0, (maximunLenghtErrorShow - 3)) + "...")
        }
        if (obj.task?.length > maximunLenghtErrorShow) {
          obj.task = (String(obj.task).slice(0, (maximunLenghtErrorShow - 3)) + "...")
        }

        rows.push([obj.message ?? "Unknown error", obj.task ?? "RUNTIME"])
      })

      pt.create(headers, rows)

      console.log(`\n⚠️  ERRORS / WARNINGS DURING BUILDING`)
      pt.print()
    }
  }

  onFinish = () => {
    if (this.taskBar != null) {
      this.taskBar.stop()
    }

    this.outputFails()
  }
}

function buildAllPackages() {
  const excludedPackages = ["builder", ...globalEnv?.ignore ?? []]
  const packagesDir = path.join(process.cwd(), 'packages')

  const packages = fs.readdirSync(packagesDir).filter((pkg) => !excludedPackages.includes(pkg))
  const sources = packages.map((dir) => {
    return path.resolve(packagesDir, dir, "src")
  })
  const outputs = packages.map((dir) => {
    return path.resolve(packagesDir, dir, 'dist')
  })

  return new Builder({ source: sources, output: outputs, taskName: packages, showProgress: true }).buildAllSources()
}

function buildSource() {
  const source = path.resolve((globalEnv?.source ?? path.join(process.cwd(), 'src')))
  return new Builder({ source, taskName: "Source", showProgress: true }).buildAllSources()
}

module.exports = {
  default: Builder,
  Builder,
  buildAllPackages,
  buildSource
}