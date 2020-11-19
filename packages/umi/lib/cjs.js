"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  utils: true,
  Service: true,
  defineConfig: true
};
Object.defineProperty(exports, "Service", {
  enumerable: true,
  get: function get() {
    return _ServiceWithBuiltIn.Service;
  }
});
Object.defineProperty(exports, "defineConfig", {
  enumerable: true,
  get: function get() {
    return _defineConfig.defineConfig;
  }
});
exports.utils = void 0;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function utils() {
  const data = _interopRequireWildcard(require("@nodecorejs/utils"));

  utils = function utils() {
    return data;
  };

  return data;
}

Object.defineProperty(exports, "utils", {
  enumerable: true,
  get: function get() {
    return utils();
  }
});

var _ServiceWithBuiltIn = require("./ServiceWithBuiltIn");

var _defineConfig = require("./defineConfig");

var _types = require("@nodecorejs/types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _types[key];
    }
  });
});

var _runtime = require("@nodecorejs/runtime");

Object.keys(_runtime).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _runtime[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _runtime[key];
    }
  });
});

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }