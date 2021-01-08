const babel = require('@babel/core')
import process from 'process'
import { join, extname, sep, resolve } from 'path'
import { existsSync, readdirSync } from 'fs'
import rimraf from 'rimraf'
import vfs from 'vinyl-fs'
import through from 'through2'

import { verbosity } from '@nodecorejs/utils'

const cwd = process.cwd()

let pkgCount = null

function getBabelConfig() {
  return {
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
}

export function transform(opts = {}) {
  const { content, path, pkg, silent } = opts
  const babelConfig = getBabelConfig()

  if (!silent) {
    const logStr = `${`📦 [${pkg.name}]`} => ${path}`
    try {
      verbosity.options({ method: `transform` }).random(logStr)
    } catch (error) {
      // woupsi
      console.log(logStr)
    }
  }

  return babel.transform(content, {
    ...babelConfig,
    filename: path,
  }).code
}

export function build(dir, opts) {
  let options = { // Define default options
    buildBuilder: false,
    cwd: cwd,
    silent: false,
    outDir: 'dist',
    buildSrc: 'src'
  }

  if (typeof (opts) !== "undefined") {
    options = { ...options, ...opts }
  }

  const pkgPath = join(options.cwd, dir, 'package.json')
  const pkg = require(pkgPath)

  const buildOut = join(dir, options.outDir)
  const srcDir = join(dir, options.buildSrc)

  if (pkg.name == require(resolve(__dirname, '../package.json')).name) {
    if (!options.buildBuilder && !options.silent) {
      console.log(`⚠️ Avoiding build the builder source!`)
      return false
    }
  }

  // clean
  rimraf.sync(join(options.cwd, buildOut))

  function createStream(src) {
    return vfs
      .src([
        src,
        `!${join(srcDir, '**/*.test.js')}`,
        `!${join(srcDir, '**/*.e2e.js')}`,
      ], {
        allowEmpty: true,
        base: srcDir,
      })
      .pipe(through.obj((f, env, cb) => {
        if (['.js', '.ts'].includes(extname(f.path)) && !f.path.includes(`${sep}templates${sep}`)) {
          f.contents = Buffer.from(
            transform({
              silent: options.silent,
              content: f.contents,
              path: f.path,
              pkg,
              root: join(options.cwd, dir),
            }),
          )
          f.path = f.path.replace(extname(f.path), '.js')
        }
        cb(null, f)
      }))
      .pipe(vfs.dest(buildOut))
  }

  const stream = createStream(join(srcDir, '**/*'))
  stream.on('end', () => {
    pkgCount -= 1

    if (pkgCount === 0 && process.send) {
      process.send('BUILD_COMPLETE')
    }
  })
}

export function buildProyect(opts) {
  const packagesPath = join(cwd, 'packages')

  if (existsSync(packagesPath)) {
    const dirs = readdirSync(join(cwd, 'packages')).filter(dir => dir.charAt(0) !== '.')
    pkgCount = dirs.length
    dirs.forEach(pkg => {
      build(`./packages/${pkg}`, { cwd, ...opts })
    })
  } else {
    pkgCount = 1
    build('./', { cwd, ...opts })
  }
}

export default buildProyect