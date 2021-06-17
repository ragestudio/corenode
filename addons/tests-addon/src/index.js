const { existsSync } = require('fs')
const { runCLI } = require('jest')
const { join } = require('path')
const assert = require('assert')
const { options } = require('jest-cli/build/cli/args')

const { createDefaultConfig } = require('./utils')
let { verbosity, mergeConfig } = require('@corenode/utils')
verbosity.options({ method: "[TEST]" })

async function runTests(args = {}) {
  process.env.NODE_ENV = 'test'
  verbosity.log(`🚧  Starting JEST tests...`)

  const cwd = args.cwd || process.cwd()

  // Read config from cwd/jest.config.js
  const userJestConfigFile = join(cwd, 'jest.config.js')
  const userJestConfig = existsSync(userJestConfigFile) && require(userJestConfigFile)


  // Read jest config from package.json
  const packageJSONPath = join(cwd, 'package.json')
  const packageJestConfig = existsSync(packageJSONPath) && require(packageJSONPath).jest


  // Merge configs
  // user config and args config could have value function for modification
  const config = mergeConfig(
    createDefaultConfig(cwd, args),
    packageJestConfig,
    userJestConfig,
  )

  // Generate jest options
  const argsConfig = Object.keys(options).reduce((prev, name) => {
    if (args[name]) prev[name] = args[name]

    // Convert alias args into real one
    const { alias } = options[name]
    if (alias && args[alias]) prev[name] = args[alias]
    return prev
  })

  // Run jest
  const result = await runCLI(
    {
      _: args._ || [],
      $0: args.$0 || '',
      config: JSON.stringify(config),
      ...argsConfig,
    },
    [cwd],
  )

  // Throw error when run failed
  assert(result.results.success, `Test with jest failed`)
}

module.exports = { runTests }