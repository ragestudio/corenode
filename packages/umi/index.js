let ex = require('./lib/cjs');
try {
  const coreExports = require('@@/core/coreExports');
  ex = Object.assign(ex, coreExports);
} catch (e) {}
module.exports = ex;
