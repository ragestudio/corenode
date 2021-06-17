const { existsSync } = require('fs')
const { join } = require('path')
const assert = require('assert')
const sc = require('smart-circular')

function generateGlobal() {
  let obj = {}
  const keys = ["project", "_env", "runtime"]
  
  keys.forEach((key) => {
    obj[key] = global[key]
  })

  return sc(obj)
}

function createDefaultConfig(cwd, args) {
  const hasPackages = existsSync(join(cwd, 'packages'))
  const hasSrc = existsSync(join(cwd, 'src'))

  const testMatchTypes = ['spec', 'test']

  const hasPackage = hasPackages && args.package
  const testMatchPrefix = hasPackage ? `**/packages/${args.package}/` : ''

  if (hasPackage) {
    assert(
      existsSync(join(cwd, 'packages', args.package)), `You specified --package, but packages/${args.package} does not exists.`,
    )
  }

  return {
    collectCoverageFrom: [
      'index.{js,jsx,ts,tsx}',
      hasSrc && 'src/**/*.{js,jsx,ts,tsx}',
      hasPackages && !args.package && 'packages/*/src/**/*.{js,jsx,ts,tsx}',
      hasPackages && args.package && `packages/${args.package}/src/**/*.{js,jsx,ts,tsx}`,
      '!**/typings/**',
      '!**/types/**',
      '!**/fixtures/**',
      '!**/*.d.ts',
    ].filter(Boolean),
    globals: generateGlobal(),
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
    setupFiles: [require.resolve('../../helpers/setupFiles/shim')],
    setupFilesAfterEnv: [require.resolve('../../helpers/setupFiles/jasmine')],
    testEnvironment: require.resolve('jest-environment-jsdom-fourteen'),
    testMatch: [
      `${testMatchPrefix}**/?*.(${testMatchTypes.join('|')}).(j|t)s?(x)`,
    ],
    testPathIgnorePatterns: ['/node_modules/', '/fixtures/', '/dist/'],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': require.resolve(
        '../../helpers/transformers/javascript',
      ),
      '^(?!.*\\.(js|jsx|ts|tsx|css|less|sass|scss|stylus|json)$)': require.resolve(
        '../../helpers/transformers/file',
      ),
    },
    verbose: true,
    transformIgnorePatterns: [
    ],
    ...(process.env.MAX_WORKERS ? { maxWorkers: Number(process.env.MAX_WORKERS) } : {}),
  }
}

module.exports = createDefaultConfig