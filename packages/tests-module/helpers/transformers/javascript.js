const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: ["@babel/preset-typescript", "@babel/preset-env"],
  babelrc: false,
  configFile: false,
});