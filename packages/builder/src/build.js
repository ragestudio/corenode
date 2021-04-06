import path from 'path'
import fs from 'fs'
import { expose } from "threads/worker"
import { Observable } from "observable-fns"

import vfs from 'vinyl-fs'
import through from 'through2'
const babel = require('@babel/core')

const fileExtWatch = [`.js`, `.ts`]
const babelConfig = getBabelConfig() // global config

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

function createStream(src, out, observer) {
    const source = [path.join(src, '**/*'), `!${path.join(src, '**/*.test.js')}`, `!${path.join(src, '**/*.e2e.js')}`]
    
    return vfs.src(source, {
        allowEmpty: true,
        base: srcDir,
    })
        .pipe(through.obj((obj, env, cb) => {
            if (fileExtWatch.includes(path.extname(obj.path)) && !obj.path.includes(`${path.sep}templates${path.sep}`)) {
                babel.transform(obj.content, { ...babelConfig, filename: obj.path }, (err, out) => {
                    if (err) {
                        return observer.error(err)
                    }
                    obj.contents = Buffer.from(out.code)
                    obj.path = obj.path.replace(path.extname(obj.path), '.js')

                    return observer.next()
                })
            }
            cb(null, obj)
        }))
        .pipe(vfs.dest(out))
}

expose({
    transform: (srcDir, buildOut) => {
        return new Observable((observer) => {
            const stream = createStream(srcDir, buildOut, observer)

            stream.on('end', () => {
                return observer.complete()
            })
        })
    }
}
)
