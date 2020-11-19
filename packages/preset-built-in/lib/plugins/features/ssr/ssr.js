"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.onBuildComplete = void 0;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function fs() {
  const data = _interopRequireWildcard(require("fs"));

  fs = function fs() {
    return data;
  };

  return data;
}

function _assert() {
  const data = _interopRequireDefault(require("assert"));

  _assert = function _assert() {
    return data;
  };

  return data;
}

function path() {
  const data = _interopRequireWildcard(require("path"));

  path = function path() {
    return data;
  };

  return data;
}

function _perf_hooks() {
  const data = require("perf_hooks");

  _perf_hooks = function _perf_hooks() {
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

function _types() {
  const data = require("@nodecorejs/types");

  _types = function _types() {
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

function _reactRouterConfig() {
  const data = require("react-router-config");

  _reactRouterConfig = function _reactRouterConfig() {
    return data;
  };

  return data;
}

function _bundlerWebpack() {
  const data = require("@nodecorejs/bundler-webpack");

  _bundlerWebpack = function _bundlerWebpack() {
    return data;
  };

  return data;
}

var _htmlUtils = require("../../commands/htmlUtils");

var _constants = require("./constants");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * onBuildComplete for test case
 * replace default html template using client webpack bundle complete
 * @param api
 */
const onBuildComplete = (api, _isTest = false) => /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(function* ({
    err,
    stats
  }) {
    if (!err && (stats === null || stats === void 0 ? void 0 : stats.stats)) {
      const HTML_REG = /<html.*?<\/html>/m;

      const _stats$stats = _slicedToArray(stats.stats, 1),
            clientStats = _stats$stats[0];

      const html = (0, _htmlUtils.getHtmlGenerator)({
        api
      });

      const _ref2 = JSON.stringify(yield html.getContent({
        route: {
          path: api.config.publicPath
        },
        chunks: clientStats.compilation.chunks
      })).match(HTML_REG) || [],
            _ref3 = _slicedToArray(_ref2, 1),
            defaultHTML = _ref3[0];

      const serverPath = path().join(api.paths.absOutputPath, _constants.OUTPUT_SERVER_FILENAME);

      if (fs().existsSync(serverPath) && defaultHTML) {
        const serverContent = fs().readFileSync(serverPath, 'utf-8').replace(HTML_REG, defaultHTML); // for test case

        if (_isTest) {
          return serverContent;
        }

        fs().writeFileSync(serverPath, serverContent);
      }
    }
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.onBuildComplete = onBuildComplete;

var _default = api => {
  api.describe({
    key: 'ssr',
    config: {
      schema: joi => {
        return joi.object({
          forceInitial: joi.boolean().description('force execing Page getInitialProps functions'),
          removeWindowInitialProps: joi.boolean().description('remove window.g_initialProps in html'),
          devServerRender: joi.boolean().description('disable serve-side render in umi dev mode.'),
          mode: joi.string().valid('stream', 'string'),
          staticMarkup: joi.boolean().description('static markup in static site')
        }).without('forceInitial', ['removeWindowInitialProps']).error(new Error('The `removeWindowInitialProps` cannot be enabled when `forceInitial` has been enabled at the same time.'));
      }
    },
    // 配置开启
    enableBy: () => {
      var _api$config;

      return (// TODO: api.EnableBy.config 读取的 userConfig，modifyDefaultConfig hook 修改后对这个判断不起效
        'ssr' in api.userConfig ? api.userConfig.ssr : (_api$config = api.config) === null || _api$config === void 0 ? void 0 : _api$config.ssr
      );
    }
  });
  api.onStart(() => {
    var _api$config$history;

    (0, _assert().default)(((_api$config$history = api.config.history) === null || _api$config$history === void 0 ? void 0 : _api$config$history.type) !== 'hash', 'the `type` of `history` must be `browser` when using SSR');

    if (api.config.dynamicImport && api.config.ssr) {
      api.logger.warn('The manifest file will be generated if enabling `dynamicImport` in ssr.');
    } // ref: https://github.com/nodecorejs/umi/issues/5501


    if (!process.env.WATCH_IGNORED) {
      const outputPath = api.config.outputPath;
      const absOutputPath = (0, _utils().winPath)(path().join(api.cwd, outputPath, '/'));
      process.env.WATCH_IGNORED = `(node_modules|${absOutputPath}(?!${_constants.OUTPUT_SERVER_FILENAME}))`;
    }
  }); // 再加一个 webpack instance

  api.modifyBundleConfigs( /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* (memo, {
      getConfig
    }) {
      return [...memo, yield getConfig({
        type: _types().BundlerConfigType.ssr
      })];
    });

    return function (_x2, _x3) {
      return _ref4.apply(this, arguments);
    };
  }());
  api.onGenerateFiles( /*#__PURE__*/_asyncToGenerator(function* () {
    var _api$config$dynamicIm, _api$config$ssr, _api$config$ssr2, _api$config$ssr3, _api$config$ssr4;

    const serverTpl = path().join((0, _utils().winPath)(__dirname), 'templates/server.tpl');
    const serverContent = fs().readFileSync(serverTpl, 'utf-8');
    const html = (0, _htmlUtils.getHtmlGenerator)({
      api
    });
    const defaultHTML = yield html.getContent({
      route: {
        path: api.config.publicPath
      },
      noChunk: true
    });
    const routes = yield api.getRoutes();
    api.writeTmpFile({
      path: 'core/server.ts',
      content: _utils().Mustache.render(serverContent, {
        Env: api.env,
        Routes: new (_core().Route)().getJSON({
          routes,
          config: api.config,
          cwd: api.cwd
        }),
        RuntimePath: (0, _utils().winPath)(path().dirname(require.resolve('@nodecorejs/runtime/package.json'))),
        Renderer: (0, _utils().winPath)(require.resolve('./templates/renderServer/renderServer')),
        RuntimePolyfill: (0, _utils().winPath)(require.resolve('regenerator-runtime/runtime')),
        loadingComponent: (_api$config$dynamicIm = api.config.dynamicImport) === null || _api$config$dynamicIm === void 0 ? void 0 : _api$config$dynamicIm.loading,
        DynamicImport: !!api.config.dynamicImport,
        Utils: (0, _utils().winPath)(require.resolve('./templates/utils')),
        Mode: !!((_api$config$ssr = api.config.ssr) === null || _api$config$ssr === void 0 ? void 0 : _api$config$ssr.mode) || 'string',
        MountElementId: api.config.mountElementId,
        StaticMarkup: !!((_api$config$ssr2 = api.config.ssr) === null || _api$config$ssr2 === void 0 ? void 0 : _api$config$ssr2.staticMarkup),
        // @ts-ignore
        ForceInitial: !!((_api$config$ssr3 = api.config.ssr) === null || _api$config$ssr3 === void 0 ? void 0 : _api$config$ssr3.forceInitial),
        RemoveWindowInitialProps: !!((_api$config$ssr4 = api.config.ssr) === null || _api$config$ssr4 === void 0 ? void 0 : _api$config$ssr4.removeWindowInitialProps),
        Basename: api.config.base,
        PublicPath: api.config.publicPath,
        ManifestFileName: api.config.manifest ? api.config.manifest.fileName || 'asset-manifest.json' : '',
        DEFAULT_HTML_PLACEHOLDER: JSON.stringify(defaultHTML)
      })
    });
    const clientExportsContent = fs().readFileSync(path().join((0, _utils().winPath)(__dirname), `templates/${_constants.CLIENT_EXPORTS}.tpl`), 'utf-8');
    api.writeTmpFile({
      path: `${_constants.TMP_PLUGIN_DIR}/${_constants.CLIENT_EXPORTS}.ts`,
      content: _utils().Mustache.render(clientExportsContent, {
        SSRUtils: (0, _utils().winPath)(require.resolve('@nodecorejs/utils/lib/ssr'))
      })
    });
  })); // run for dynamicImport in exportStatic

  api.modifyHTMLChunks( /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(function* (memo, opts) {
      const route = opts.route; // remove server bundle entry in html
      // for dynamicImport

      if (api.config.dynamicImport && api.env === 'production' && opts.chunks && route.path && route.component) {
        // different pages using correct chunks, not load all chunks
        const chunkArr = [];
        const routes = yield api.getRoutes();
        const matchedRoutes = (0, _reactRouterConfig().matchRoutes)(routes, route.path);

        const chunks = _utils().lodash.uniq(matchedRoutes.map(matchedRoute => matchedRoute.route.component ? (0, _utils().routeToChunkName)({
          route: matchedRoute.route,
          cwd: api.cwd
        }) : null));

        chunks.forEach(chunk => {
          if (chunk && opts.chunks.find(c => c.name.startsWith(chunk))) {
            chunkArr.push(chunk);
          }
        });
        return _utils().lodash.uniq([...memo, ...chunkArr]);
      }

      return memo;
    });

    return function (_x4, _x5) {
      return _ref6.apply(this, arguments);
    };
  }());
  api.modifyConfig(config => {
    // force enable writeToDisk
    config.devServer.writeToDisk = filePath => {
      var _api$config2, _api$config2$manifest;

      const manifestFile = ((_api$config2 = api.config) === null || _api$config2 === void 0 ? void 0 : (_api$config2$manifest = _api$config2.manifest) === null || _api$config2$manifest === void 0 ? void 0 : _api$config2$manifest.fileName) || 'asset-manifest.json';
      const regexp = new RegExp(`(${_constants.OUTPUT_SERVER_FILENAME}|${manifestFile})$`);
      return regexp.test(filePath);
    }; // enable manifest


    if (config.dynamicImport) {
      config.manifest = _objectSpread({
        writeToFileEmit: false
      }, config.manifest || {});
    }

    return config;
  }); // modify devServer content

  api.modifyDevHTMLContent( /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(function* (defaultHtml, {
      req
    }) {
      var _api$config3;

      // umi dev to enable server side render by default
      const _ref8 = ((_api$config3 = api.config) === null || _api$config3 === void 0 ? void 0 : _api$config3.ssr) || {},
            stream = _ref8.stream,
            _ref8$devServerRender = _ref8.devServerRender,
            devServerRender = _ref8$devServerRender === void 0 ? true : _ref8$devServerRender;

      const serverPath = path().join(api.paths.absOutputPath, _constants.OUTPUT_SERVER_FILENAME);

      if (!devServerRender) {
        return defaultHtml;
      }

      try {
        var _api$config4;

        const startTime = _perf_hooks().performance.nodeTiming.duration;

        const render = require(serverPath);

        const context = {};

        const _yield$render = yield render({
          origin: `${req.protocol}://${req.get('host')}`,
          // with query
          path: req.url,
          context,
          htmlTemplate: defaultHtml,
          mountElementId: (_api$config4 = api.config) === null || _api$config4 === void 0 ? void 0 : _api$config4.mountElementId
        }),
              html = _yield$render.html,
              error = _yield$render.error;

        const endTime = _perf_hooks().performance.nodeTiming.duration;

        console.log(`[SSR] ${stream ? 'stream' : ''} render ${req.url} start: ${(endTime - startTime).toFixed(2)}ms`);

        if (error) {
          throw error;
        } // if dev clear cache, OOM


        if (require.cache[serverPath]) {
          // replace default html
          delete require.cache[serverPath];
        }

        return html;
      } catch (e) {
        api.logger.error('[SSR]', e);
      }

      return defaultHtml;
    });

    return function (_x6, _x7) {
      return _ref7.apply(this, arguments);
    };
  }()); // 修改

  api.chainWebpack( /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(function* (config, opts) {
      const paths = api.paths;
      const type = opts.type;
      const serverEntryPath = path().join(paths.absTmpPath, 'core/server.ts');

      if (type === _types().BundlerConfigType.ssr) {
        config.entryPoints.clear();
        config.entry(_constants.CHUNK_NAME).add(serverEntryPath);
        config.target('node');
        config.name(_constants.CHUNK_NAME);
        config.devtool(false);
        config.output.filename(_constants.OUTPUT_SERVER_FILENAME) // avoid using `require().default`, just using `require()`
        .libraryExport('default').chunkFilename('[name].server.js').libraryTarget('commonjs2'); // disable *.server.chunk.js, routes avoid dynamic and require in different mode.

        config.plugin('limit-chunk').use(_bundlerWebpack().webpack.optimize.LimitChunkCountPlugin, [{
          maxChunks: 1
        }]);
        config.plugin('define').tap(([args]) => [_objectSpread(_objectSpread({}, args), {}, {
          'window.routerBase': JSON.stringify(api.config.base),
          'process.env.__IS_SERVER': true
        })]);
        config.externals([]);
      } else {
        // define client bundler config
        config.plugin('define').tap(([args]) => [_objectSpread(_objectSpread({}, args), {}, {
          'process.env.__IS_SERVER': false
        })]);
      }

      return config;
    });

    return function (_x8, _x9) {
      return _ref9.apply(this, arguments);
    };
  }()); // runtime ssr plugin

  api.addRuntimePluginKey(() => 'ssr');
  api.addcoreExports(() => [{
    exportAll: true,
    source: `../${_constants.TMP_PLUGIN_DIR}/${_constants.CLIENT_EXPORTS}`
  }]); // replace html default html template
  // fixed: hash: true, defaultHTML not update

  api.onBuildComplete(onBuildComplete(api));
};

exports.default = _default;