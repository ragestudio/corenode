import path from 'path'
import fs from 'fs'
import { expose } from "threads/worker"
const babel = require('@babel/core')

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

expose({
    transform: (content, filename) => {
        return new Promise((resolve, reject) => {
            const babelConfig = getBabelConfig()
            babel.transform(content, { ...babelConfig, filename: filename }, (err, res) => {
                if (err) {
                    return reject(err)
                }
                return resolve(res)
            })
        })
    }
})
