const { existsSync } = require('fs')
const { join } = require('path')
const assert = require('assert')


function createDefaultConfig(cwd, args) {
  const hasPackages = existsSync(join(cwd, 'packages'))
  const hasSrc = existsSync(join(cwd, 'src'))

  const testMatchTypes = ['spec', 'test']

  const hasPackage = hasPackages && args.package
  const testMatchPrefix = hasPackage ? `packages/${args.package}/` : ''

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
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
    testMatch: [
      `${testMatchPrefix}**/?*.(${testMatchTypes.join('|')}).(j|t)s?(x)`,
      '!node_modules'
    ],
    ignoreMatch: ['**/*/node_modules', '**/*/fixtures', '**/*/dist'],
    verbose: true,
    transformIgnorePatterns: [
    ],
    ...(process.env.MAX_WORKERS ? { maxWorkers: Number(process.env.MAX_WORKERS) } : {}),
  }
}

module.exports = createDefaultConfig