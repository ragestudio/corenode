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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(api) {
  api.describe({
    key: 'links',
    config: {
      schema(joi) {
        return joi.array();
      }

    }
  });
  api.addHTMLLinks(() => {
    var _api$config;

    return ((_api$config = api.config) === null || _api$config === void 0 ? void 0 : _api$config.links) || [];
  });
}