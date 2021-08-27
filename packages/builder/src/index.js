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

    if (typeof this.params.dir === "undefined") {
      throw new Error("dir not defined!")
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

      if (Array.isArray(this.params.dir)) {
        queue = this.params.dir.map(dir => {
          return path.resolve(dir)
        })
      } else {
        queue.push(path.resolve(this.params.dir))
      }

      const isOnce = queue.length === 1

      for await (const dir of queue) {
        let output = []

        if (typeof this.params.output !== "undefined") {
          output.push(this.params.output)
        } else {
          output.push(dir)
          output.push("../dist")

          // TODO: (FIX) Deleting the dist folder its causing an read file exception, its async issue with rimraf library
          // check if dist output is already exists and remove it
          // const distDir = path.resolve(output.join("/"))
          // if (fs.existsSync(distDir) && fs.statSync(distDir).isDirectory()) {
          //   await rimraf.sync(distDir)
          // }
        }

        if (!isOnce) {
          output.push(path.basename(dir))
        }

        const inputPath = path.resolve(dir)
        const outputPath = path.resolve(output.join("/"))

        await this.buildFromDir(inputPath, outputPath)
          .catch(({ message, task }) => {
            this.handleError(message, path.basename(task), inputPath)
          })
      }

      this.onFinish()
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

  buildFromDir = (input, output) => {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(input)) {
        return reject({ message: "Input directory does not exist", task: input })
      }

      const isFile = !fs.lstatSync(input).isDirectory()

      const job = path.basename(input)
      const sources = isFile ? [isFile] : lib.listAllFiles(input)

      if (!sources) {
        return reject(`No sources available for [${job}]`, 0, job)
      }

      if (this.taskBar != null) {
        this.bars[job] = this.taskBar.create(sources.length, 0)
        this.bars[job].update(0, { filename: job })
      }

      const globSource = [
        path.join(input, `**/*`),
        `!${path.join(input, `**/*.test.js`)}`
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
              return `> ${timestamp} ${file? `[${file}]` : ""} (builder)[${label ?? "log"}] : ${message}`
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

module.exports = {
  default: Builder,
  Builder,
}