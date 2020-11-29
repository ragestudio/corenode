module.exports = {
  // disable css files mock for bundler-webpack's css import tests
  moduleNameMapper: {},
  collectCoverageFrom(memo) {
    return memo.concat([
      // benchmarks
      '!benchmarks/**/*',
      '!packages/bundler-webpack/src/getConfig/setPublicPath.ts',
      '!packages/bundler-webpack/src/getConfig/runtimePublicPathEntry.ts',
      '!packages/bundler-webpack/src/webpackHotDevClient/*',

      '!packages/bundler-webpack/src/cli.ts',
      '!packages/nodecore/src/cli.ts',
      '!packages/nodecore/src/forkedDev.ts',
      '!packages/nodecore/src/ServiceWithBuiltIn.ts',
      '!packages/nodecore/src/utils/fork.ts',

      '!packages/preset-built-in/src/plugins/commands/dev/**/*',
    ]);
  },
};
