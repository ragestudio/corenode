const fs = require('fs')
const path = require('path')

const mocha = require('mocha')
const chai = require('chai')
const assert = require('assert')

const { createDefaultConfig } = require('./utils')
const { logger } = require('corenode')
const { mergeConfig } = require('@corenode/utils')
const { matchSync } = require('filesystem')

const state = new logger({ id: `#TESTS` })

async function runTests(args = {}) {
  process.env.NODE_ENV = 'test'
  state.log(`🧰  Starting unit tests...`)

  const cwd = args.cwd || process.cwd()

  const configFilePath = path.join(cwd, 'tests.config.js')
  const configFile = fs.existsSync(configFilePath) && require(configFilePath)

  const packageJSON = runtime.helpers.getRootPackage()
  const packageConfig = packageJSON.tests

  const config = mergeConfig(
    createDefaultConfig(cwd, args),
    packageConfig,
    configFile,
  )
  const patters = [...config.testMatch, ...config.ignoreMatch.map((ignore) => { return `!${ignore}` })]
  const sources = matchSync(patters)

  //* load global
  // add assert
  global.assert = assert
  // add chai lib
  Object.keys(chai).forEach((key) => {
    global[key] = chai[key]
  })

  const testInstance = new mocha()

  sources.forEach((match) => {
    testInstance.addFile(path.resolve(cwd, match))
  })

  // Run
  testInstance.run((errors) => {
    if (errors > 0) {
      state.dump(errors)
      state.error(result)

    }
  })
}

module.exports = { runTests }