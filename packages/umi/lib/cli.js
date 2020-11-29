"use strict";

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _path() {
  const data = require("path");

  _path = function _path() {
    return data;
  };

  return data;
}

function _utils() {
  const data = require("@nodecorejs/utils");

  _utils = function _utils() {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("fs");

  _fs = function _fs() {
    return data;
  };

  return data;
}

var _ServiceWithBuiltIn = require("./ServiceWithBuiltIn");

var _fork = _interopRequireDefault(require("./utils/fork"));

var _getCwd = _interopRequireDefault(require("./utils/getCwd"));

var _getPkg = _interopRequireDefault(require("./utils/getPkg"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// process.argv: [node, umi.js, command, args]
const args = (0, _utils().yParser)(process.argv.slice(2), {
  alias: {
    version: ['v'],
    help: ['h']
  },
  boolean: ['version']
});

if (args.version && !args._[0]) {
  args._[0] = 'version';
  const local = (0, _fs().existsSync)((0, _path().join)(__dirname, '../.local')) ? _utils().chalk.cyan('@local') : '';
  console.log(`umi@${require('../package.json').version}${local}`);
} else if (!args._[0]) {
  args._[0] = 'help';
}

_asyncToGenerator(function* () {
  try {
    switch (args._[0]) {
      case 'dev':
        const child = (0, _fork.default)({
          scriptPath: require.resolve('./forkedDev')
        }); // ref:
        // http://nodejs.cn/api/process/signal_events.html

        process.on('SIGINT', () => {
          child.kill('SIGINT');
          process.exit(1);
        });
        process.on('SIGTERM', () => {
          child.kill('SIGTERM');
          process.exit(1);
        });
        break;

      default:
        const name = args._[0];

        if (name === 'build') {
          process.env.NODE_ENV = 'production';
        }

        yield new _ServiceWithBuiltIn.Service({
          cwd: (0, _getCwd.default)(),
          pkg: (0, _getPkg.default)(process.cwd())
        }).run({
          name,
          args
        });
        break;
    }
  } catch (e) {
    console.error(_utils().chalk.red(e.message));
    console.error(e.stack);
    process.exit(1);
  }
})();