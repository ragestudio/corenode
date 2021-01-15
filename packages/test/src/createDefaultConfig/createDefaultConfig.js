import { isProyectMode } from '@nodecorejs/dot-runtime'
import { existsSync } from 'fs'
import { join } from 'path'
import assert from 'assert'

export default function (cwd, args) {
  const testMatchTypes = ['spec', 'test']

  const isProyectMode = isProyectMode(cwd)
  const hasPackage = isProyectMode && args.package
  const testMatchPrefix = hasPackage ? `**/packages/${args.package}/` : ''
  const hasSrc = existsSync(join(cwd, 'src'))

  if (hasPackage) {
    assert(
      existsSync(join(cwd, 'packages', args.package != null)), `You specified --package, but packages/${args.package} does not exists.`,
    )
  }

  return {
    collectCoverageFrom: [
      'index.{js,jsx,ts,tsx}',
      hasSrc && 'src/**/*.{js,jsx,ts,tsx}',
      isProyectMode && !args.package && 'packages/*/src/**/*.{js,jsx,ts,tsx}',
      isProyectMode && args.package && `packages/${args.package}/src/**/*.{js,jsx,ts,tsx}`,
      '!**/typings/**',
      '!**/types/**',
      '!**/fixtures/**',
      '!**/*.d.ts',
    ].filter(Boolean),
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
    moduleNameMapper: {
      '\\.(css|less|sass|scss|stylus)$': require.resolve('identity-obj-proxy'),
    },
    setupFiles: [require.resolve('../../helpers/setupFiles/shim')],
    setupFilesAfterEnv: [require.resolve('../../helpers/setupFiles/jasmine')],
    testEnvironment: require.resolve('jest-environment-jsdom-fourteen'),
    testMatch: [
      `${testMatchPrefix}**/?*.(${testMatchTypes.join('|')}).(j|t)s?(x)`,
    ],
    testPathIgnorePatterns: ['/node_modules/', '/fixtures/'],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': require.resolve(
        '../../helpers/transformers/javascript',
      ),
      '^.+\\.(css|less|sass|scss|stylus)$': require.resolve(
        '../../helpers/transformers/css',
      ),
      '^(?!.*\\.(js|jsx|ts|tsx|css|less|sass|scss|stylus|json)$)': require.resolve(
        '../../helpers/transformers/file',
      ),
    },
    verbose: true,
    transformIgnorePatterns: [
    ],
    ...(process.env.MAX_WORKERS? { maxWorkers: Number(process.env.MAX_WORKERS) }: {}),
  }
}
