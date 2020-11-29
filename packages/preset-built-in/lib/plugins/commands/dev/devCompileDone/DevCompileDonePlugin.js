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

function _utils() {
  const data = require("@nodecorejs/utils");

  _utils = function _utils() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class DevCompileDonePlugin {
  constructor(opts) {
    this.opts = void 0;
    this.opts = opts;
  }

  apply(compiler) {
    let isFirstCompile = true;
    compiler.hooks.done.tap('DevFirstCompileDone', stats => {
      var _this$opts$onCompileD, _this$opts2;

      if (stats.hasErrors()) {
        var _this$opts$onCompileF, _this$opts;

        (_this$opts$onCompileF = (_this$opts = this.opts).onCompileFail) === null || _this$opts$onCompileF === void 0 ? void 0 : _this$opts$onCompileF.call(_this$opts, {
          stats
        });
        return;
      }

      if (isFirstCompile) {
        const lanIp = _utils().address.ip();

        const protocol = this.opts.https ? 'https' : 'http';
        const hostname = this.opts.hostname === '0.0.0.0' ? 'localhost' : this.opts.hostname;
        const localUrl = `${protocol}://${hostname}:${this.opts.port}`;
        const lanUrl = `${protocol}://${lanIp}:${this.opts.port}`;
        console.log([`\n\nApp listening to:`, `\n\n\n- Local: ${_utils().chalk.cyan(localUrl)}`, lanUrl && `\n\n- Network: ${_utils().chalk.cyan(lanUrl)}`].filter(Boolean).join('\n'));
      }

      (_this$opts$onCompileD = (_this$opts2 = this.opts).onCompileDone) === null || _this$opts$onCompileD === void 0 ? void 0 : _this$opts$onCompileD.call(_this$opts2, {
        isFirstCompile,
        stats
      });

      if (isFirstCompile) {
        var _process$send, _process;

        isFirstCompile = false;
        (_process$send = (_process = process).send) === null || _process$send === void 0 ? void 0 : _process$send.call(_process, {
          type: 'DONE'
        });
      }
    });
  }

}

exports.default = DevCompileDonePlugin;