const babel = require('@babel/core')
import rimraf from 'rimraf'
import vfs from 'vinyl-fs'
import through from 'through2'

import path from 'path'
import fs from 'fs'
import { expose } from "threads/worker"

const cwd = process.cwd()

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

function transform(opts = {}) {
    return new Promise((resolve, reject) => {
        const { content, path, } = opts
        const babelConfig = getBabelConfig()

        babel.transform(content, {
            ...babelConfig,
            filename: path,
        }, (err, res) => {
            if (err) {
                reject(err)
            }
            resolve(res)
        })
    })
}

function build({ dir, opts }) {
    return new Promise((resolve, reject) => {
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
                return reject(`Skipping build builder`)
            }
        }

        rimraf.sync(path.join(options.cwd, buildOut))

        function createStream(src) {
            return vfs.src([src, `!${path.join(srcDir, '**/*.test.js')}`, `!${path.join(srcDir, '**/*.e2e.js')}`,], {
                allowEmpty: true,
                base: srcDir,
            })
                .pipe(through.obj((f, env, cb) => {
                    if (['.js', '.ts'].includes(path.extname(f.path)) && !f.path.includes(`${path.sep}templates${path.sep}`)) {
                        transform({
                            silent: options.silent,
                            content: f.contents,
                            path: f.path,
                            pkg,
                            root: path.join(options.cwd, dir),
                        })
                        .catch((err) => {
                            reject(err)
                        })
                        .then((code) => {
                            f.contents = Buffer.from(code)
                            f.path = f.path.replace(path.extname(f.path), '.js')
                        })
                    }
                    cb(null, f)
                }))
                .pipe(vfs.dest(buildOut))
        }

        const stream = createStream(path.join(srcDir, '**/*'))
        stream.on('end', () => {
            return resolve()
        })
    })
}

expose({
    builderTask: build
})
