"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _default = api => {
  const paths = api.paths,
        pkg = api.pkg,
        cwd = api.cwd;
  api.describe({
    key: 'alias',
    config: {
      schema(joi) {
        return joi.object();
      },

      default: {
        'react-router': (0, _path().dirname)(require.resolve('react-router/package.json')),
        'react-router-dom': (0, _path().dirname)(require.resolve('react-router-dom/package.json')),
        history: (0, _path().dirname)(require.resolve('history-with-query/package.json'))
      }
    }
  });

  function getUserLibDir({
    library
  }) {
    if (pkg.dependencies && pkg.dependencies[library] || pkg.devDependencies && pkg.devDependencies[library] || pkg.clientDependencies && pkg.clientDependencies[library]) {
      return (0, _utils().winPath)((0, _path().dirname)(_utils().resolve.sync(`${library}/package.json`, {
        basedir: cwd
      })));
    }

    return null;
  }

  api.chainWebpack( /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(function* (memo) {
      const libraries = yield api.applyPlugins({
        key: 'addProjectFirstLibraries',
        type: api.ApplyPluginsType.add,
        initialValue: [{
          name: 'react',
          path: (0, _path().dirname)(require.resolve(`react/package.json`))
        }, {
          name: 'react-dom',
          path: (0, _path().dirname)(require.resolve(`react-dom/package.json`))
        }]
      });
      libraries.forEach(library => {
        memo.resolve.alias.set(library.name, getUserLibDir({
          library: library.name
        }) || library.path);
      });
      memo.resolve.alias.set('@', paths.absSrcPath);
      memo.resolve.alias.set('@@', paths.absTmpPath);
      return memo;
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
};

exports.default = _default;