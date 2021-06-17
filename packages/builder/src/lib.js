import path from 'path'
import fs from 'fs'
const babel = require("@babel/core")

export const defaultBabelPresets = [
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
]

export const defaultBabelPlugins = [
  require.resolve('@babel/plugin-transform-runtime'),
  require.resolve('@babel/plugin-proposal-export-default-from'),
  require.resolve('@babel/plugin-proposal-do-expressions'),
  require.resolve('@babel/plugin-proposal-class-properties'),
]

export const defaultBabelConfig = {
  presets: defaultBabelPresets,
  plugins: defaultBabelPlugins,
}

export const agents = {
  babel: (contents, options) => {
    return new Promise((resolve, reject) => {
      try {
        let opts = options ?? {}

        babel.transform(contents, { ...defaultBabelConfig, ...opts }, (err, result) => {
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
}

export function listAllFiles(dir) {
  return fs.readdirSync(dir).reduce((list, file) => {
    const name = path.join(dir, file)
    const isDir = fs.statSync(name).isDirectory()

    return list.concat(isDir ? listAllFiles(name) : [name])
  }, [])
}

export function getBuilderEnv(from) {
  if (fs.statSync(from).isDirectory()) {
    from = path.resolve(from ?? process.cwd(), '.builder')
  }

  return JSON.parse(fs.readFileSync(from, 'utf-8'))
}