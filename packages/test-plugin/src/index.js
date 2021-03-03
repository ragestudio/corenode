import { runCLI } from 'jest'
import { options as CliOptions } from 'jest-cli/build/cli/args'
import assert from 'assert'
import { join } from 'path'
import { existsSync } from 'fs'
import { mergeConfig } from '@nodecorejs/utils'
import createDefaultConfig from './createDefaultConfig/createDefaultConfig'

let { verbosity } = require('@nodecorejs/utils')
verbosity.options({ method: "[TEST]", dumpFile: true })

export * from './utils'

export default async function (args) {
  process.env.NODE_ENV = 'test'
  verbosity.log(`🚧  Starting JEST tests...`)
  verbosity.dump(`args: ${JSON.stringify(args)}`)

  const cwd = args.cwd || process.cwd()

  // Read config from cwd/jest.config.js
  const userJestConfigFile = join(cwd, 'jest.config.js')
  const userJestConfig = existsSync(userJestConfigFile) && require(userJestConfigFile)

  verbosity.dump(`config from jest.config.js: ${JSON.stringify(userJestConfig)}`)

  // Read jest config from package.json
  const packageJSONPath = join(cwd, 'package.json')
  const packageJestConfig = existsSync(packageJSONPath) && require(packageJSONPath).jest

  verbosity.dump(`jest config from package.json: ${JSON.stringify(packageJestConfig)}`)

  // Merge configs
  // user config and args config could have value function for modification
  const config = mergeConfig(
    createDefaultConfig(cwd, args),
    packageJestConfig,
    userJestConfig,
  )
  verbosity.dump(`final config: ${JSON.stringify(config)}`)

  // Generate jest options
  const argsConfig = Object.keys(CliOptions).reduce((prev, name) => {
    if (args[name]) prev[name] = args[name]

    // Convert alias args into real one
    const { alias } = CliOptions[name]
    if (alias && args[alias]) prev[name] = args[alias]
    return prev
  })
  verbosity.dump(`config from args: ${JSON.stringify(argsConfig)}`)

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
  verbosity.dump(`JEST returns results >`, result)

  // Throw error when run failed
  assert(result.results.success, `Test with jest failed`)
}
