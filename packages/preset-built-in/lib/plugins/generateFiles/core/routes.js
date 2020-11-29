"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
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

function _path() {
  const data = require("path");

  _path = function _path() {
    return data;
  };

  return data;
}

function _core() {
  const data = require("@nodecorejs/core");

  _core = function _core() {
    return data;
  };

  return data;
}

var _constants = require("../constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _default(api) {
  const cwd = api.cwd,
        Mustache = api.utils.Mustache;
  api.onGenerateFiles( /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(function* (args) {
      var _api$config$dynamicIm;

      const routesTpl = (0, _fs().readFileSync)((0, _path().join)(__dirname, 'routes.tpl'), 'utf-8');
      const routes = yield api.getRoutes();
      api.writeTmpFile({
        path: 'core/routes.ts',
        content: Mustache.render(routesTpl, {
          routes: new (_core().Route)().getJSON({
            routes,
            config: api.config,
            cwd
          }),
          runtimePath: _constants.runtimePath,
          config: api.config,
          loadingComponent: (_api$config$dynamicIm = api.config.dynamicImport) === null || _api$config$dynamicIm === void 0 ? void 0 : _api$config$dynamicIm.loading
        })
      });
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }()); // 这个加进去会导致 patchRoutes 在最初就执行，但期望的是在 render 后执行
  // 所以先不加
  // api.addcoreExports(() => {
  //   return {
  //     specifiers: ['routes'],
  //     source: `./routes`,
  //   };
  // });
}