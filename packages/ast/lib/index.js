"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "isReactComponent", {
  enumerable: true,
  get: function get() {
    return _isReactComponent.isReactComponent;
  }
});
Object.defineProperty(exports, "getExportProps", {
  enumerable: true,
  get: function get() {
    return _getExportProps.getExportProps;
  }
});

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

var _isReactComponent = require("./isReactComponent/isReactComponent");

var _getExportProps = require("./getExportProps/getExportProps");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }