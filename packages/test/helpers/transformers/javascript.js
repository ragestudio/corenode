const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: [],
  babelrc: false,
  configFile: false,
});
