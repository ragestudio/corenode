const babel = require('@babel/core')
import rimraf from 'rimraf'
import vfs from 'vinyl-fs'
import through from 'through2'
import child_process from'child_process'

import path from 'path'
import fs from 'fs'

import { verbosity, prettyTable, objectToArrayMap } from '@nodecorejs/utils'

const cwd = process.cwd()
const ignoredPackages = getIgnoredPackages()

function getIgnoredPackages() {
  let ignored = []

  const file = path.resolve(process.cwd(), ".buildIgnore")
  if (fs.existsSync(file)) {
    try {
      ignored = JSON.parse(fs.readFileSync(file, 'utf-8'))
    } catch (error) {
      verbosity.dump(error)
      verbosity.error(`Error parsing .buildIgnore > ${error.message}`)
    }
  }

  return ignored
}

function getCustomConfig() {
  const customConfigFile = path.resolve(process.cwd(), '.builder')

  if (fs.existsSync(customConfigFile)) {
    try {
      return JSON.parse(fs.readFileSync(customConfigFile, 'utf-8'))
    } catch (error) {
      console.log(`Error while parsing custom config > ${error}`)
      return null
    }
  }
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
  const customConfig = getCustomConfig()

  if (customConfig) {
    config = { ...config, ...customConfig }
  }

  return config
}

export function transform(opts = {}) {
  const { content, path, pkg, silent } = opts
  const babelConfig = getBabelConfig()

  if (!silent) {
    const logStr = `${`📦 [${pkg.name}]`} => ${path}`
    try {
      verbosity.options({ method: `transform` }).random(logStr)
    } catch (error) {
      console.log(logStr)
    }
  }

  return babel.transform(content, {
    ...babelConfig,
    filename: path,
  }).code
}

export function build(dir, opts, callback) {
  let options = {
    buildBuilder: false,
    cwd: cwd,
    silent: false,
    outDir: 'dist',
    buildSrc: 'src'
  }

  if (typeof (opts) !== "undefined") {
    options = { ...options, ...opts }
  }

  const pkgPath = path.join(options.cwd, dir, 'package.json')
  const pkg = require(pkgPath)

  const buildOut = path.join(dir, options.outDir)
  const srcDir = path.join(dir, options.buildSrc)

  if (pkg.name == require(path.resolve(__dirname, '../package.json')).name) {
    if (!options.buildBuilder) {
      return false
    }
  }

  if (pkg.name) {

  }


  // clean
  rimraf.sync(path.join(options.cwd, buildOut))

  function createStream(src) {
    return vfs
      .src([
        src,
        `!${path.join(srcDir, '**/*.test.js')}`,
        `!${path.join(srcDir, '**/*.e2e.js')}`,
      ], {
        allowEmpty: true,
        base: srcDir,
      })
      .pipe(through.obj((f, env, cb) => {
        if (['.js', '.ts'].includes(path.extname(f.path)) && !f.path.includes(`${path.sep}templates${path.sep}`)) {
          f.contents = Buffer.from(
            transform({
              silent: options.silent,
              content: f.contents,
              path: f.path,
              pkg,
              root: path.join(options.cwd, dir),
            }),
          )
          f.path = f.path.replace(path.extname(f.path), '.js')
        }
        cb(null, f)
      }))
      .pipe(vfs.dest(buildOut))
  }

  const stream = createStream(path.join(srcDir, '**/*'))
  stream.on('end', () => {
    return callback(true)
  })
}

export function buildProyect(opts) {
  return new Promise((resolve, reject) => {
    const packagesPath = path.join(cwd, 'packages')
    const isProyectMode = fs.existsSync(packagesPath)
    const pt = new prettyTable()

    let count = 0
    let packages = isProyectMode ? fs.readdirSync(packagesPath).filter((dir) => dir.charAt(0) !== '.') : ["./"]
    let dirs = packages.map((name) => {
      return isProyectMode ? `./packages/${name}` : `${name}`
    })

    try {
      let headers = ["package", "sources", "process"]
      let rows = []
  
      objectToArrayMap(packages).forEach((_package) => {
        let sources = 0
        const packagePath = path.join(packagesPath, _package.value)
        
        try {
          sources = fs.readdirSync(packagePath).length
        } catch (error) {
          // terrible
        }
  
        rows.push([`[${_package.key}] ${_package.value}`, sources, `020202`])
      })
  
      pt.create(headers, rows)
      pt.print()
  
    } catch (error) {
      console.error(error)      
    }

    dirs.forEach((dir) => {
      // const process = child_process.exec('node libfn.js', function(err, stdout, stderr) {
      //   var output = JSON.parse(stdout);
      //   cb(err, output);
      // });

      // process.stdin.write(JSON.stringify(array), 'utf8');
      // process.stdin.end();

      build(dir, { cwd, ...opts }, (done) => {
        count++
        if (dir.length == (count + 1)) {
          resolve(true)
        }
      })
    })

  })
}

export default buildProyect