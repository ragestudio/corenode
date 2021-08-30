const fs = require('fs')
const path = require('path')
const babel = require("@babel/core")

const defaultBabelPresets = [
  [
    require.resolve('@babel/preset-typescript'),
    {},
  ],
  [
    require.resolve('@babel/preset-env'),
    {
      targets: {
        node: 16,
        esmodules: true
      }
    },
  ],
]

const defaultBabelPlugins = [
  require.resolve('@babel/plugin-transform-runtime'),
  require.resolve('@babel/plugin-proposal-export-default-from'),
  require.resolve('@babel/plugin-proposal-do-expressions'),
  require.resolve('@babel/plugin-proposal-class-properties'),
]

const defaultBabelConfig = {
  presets: defaultBabelPresets,
  plugins: defaultBabelPlugins,
}

const agents = {
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

function listAllFiles(dir) {
  return fs.readdirSync(dir).reduce((list, file) => {
    const name = path.join(dir, file)
    const isDir = fs.statSync(name).isDirectory()

    return list.concat(isDir ? listAllFiles(name) : [name])
  }, [])
}

function getBuilderEnv(from = process.cwd()) {
  if (fs.existsSync(from) && fs.lstatSync(from).isDirectory()) {
    from = path.resolve(from, '.builder')
    return JSON.parse(fs.readFileSync(from, 'utf-8'))
  } else {
    return {}
  }
}

module.exports = {
  agents,
  listAllFiles,
  getBuilderEnv,
  defaultBabelConfig,
  defaultBabelPlugins,
  defaultBabelPresets
}