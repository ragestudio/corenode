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

function _assert() {
  const data = _interopRequireDefault(require("assert"));

  _assert = function _assert() {
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

var _Logger = _interopRequireDefault(require("../Logger/Logger"));

var _pluginUtils = require("./utils/pluginUtils");

var _enums = require("./enums");

var _Html = _interopRequireDefault(require("../Html/Html"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class PluginAPI {
  constructor(opts) {
    this.id = opts.id;
    this.key = opts.key;
    this.service = opts.service;
    this.utils = utils();
    this.Html = _Html.default;
    this.logger = new _Logger.default(`umi:plugin:${this.id || this.key}`);
  } // TODO: reversed keys


  describe({
    id,
    key,
    config,
    enableBy
  } = {}) {
    const plugins = this.service.plugins; // this.id and this.key is generated automatically
    // so we need to diff first

    if (id && this.id !== id) {
      if (plugins[id]) {
        const name = plugins[id].isPreset ? 'preset' : 'plugin';
        throw new Error(`api.describe() failed, ${name} ${id} is already registered by ${plugins[id].path}.`);
      }

      plugins[id] = plugins[this.id];
      plugins[id].id = id;
      delete plugins[this.id];
      this.id = id;
    }

    if (key && this.key !== key) {
      this.key = key;
      plugins[this.id].key = key;
    }

    if (config) {
      plugins[this.id].config = config;
    }

    plugins[this.id].enableBy = enableBy || _enums.EnableBy.register;
  }

  register(hook) {
    (0, _assert().default)(hook.key && typeof hook.key === 'string', `api.register() failed, hook.key must supplied and should be string, but got ${hook.key}.`);
    (0, _assert().default)(hook.fn && typeof hook.fn === 'function', `api.register() failed, hook.fn must supplied and should be function, but got ${hook.fn}.`);
    this.service.hooksByPluginId[this.id] = (this.service.hooksByPluginId[this.id] || []).concat(hook);
  }

  registerCommand(command) {
    const name = command.name,
          alias = command.alias;
    (0, _assert().default)(!this.service.commands[name], `api.registerCommand() failed, the command ${name} is exists.`);
    this.service.commands[name] = command;

    if (alias) {
      this.service.commands[alias] = name;
    }
  }

  registerPresets(presets) {
    (0, _assert().default)(this.service.stage === _enums.ServiceStage.initPresets, `api.registerPresets() failed, it should only used in presets.`);
    (0, _assert().default)(Array.isArray(presets), `api.registerPresets() failed, presets must be Array.`);
    const extraPresets = presets.map(preset => {
      return (0, _pluginUtils.isValidPlugin)(preset) ? preset : (0, _pluginUtils.pathToObj)({
        type: _enums.PluginType.preset,
        path: preset,
        cwd: this.service.cwd
      });
    });

    this.service._extraPresets.splice(0, 0, ...extraPresets);
  }

  registerPlugins(plugins) {
    (0, _assert().default)(this.service.stage === _enums.ServiceStage.initPresets || this.service.stage === _enums.ServiceStage.initPlugins, `api.registerPlugins() failed, it should only be used in registering stage.`);
    (0, _assert().default)(Array.isArray(plugins), `api.registerPlugins() failed, plugins must be Array.`);
    const extraPlugins = plugins.map(plugin => {
      return (0, _pluginUtils.isValidPlugin)(plugin) ? plugin : (0, _pluginUtils.pathToObj)({
        type: _enums.PluginType.plugin,
        path: plugin,
        cwd: this.service.cwd
      });
    });

    if (this.service.stage === _enums.ServiceStage.initPresets) {
      this.service._extraPlugins.push(...extraPlugins);
    } else {
      this.service._extraPlugins.splice(0, 0, ...extraPlugins);
    }
  }

  registerMethod({
    name,
    fn,
    exitsError = true
  }) {
    if (this.service.pluginMethods[name]) {
      if (exitsError) {
        throw new Error(`api.registerMethod() failed, method ${name} is already exist.`);
      } else {
        return;
      }
    }

    this.service.pluginMethods[name] = fn || function (fn) {
      const hook = _objectSpread({
        key: name
      }, utils().lodash.isPlainObject(fn) ? fn : {
        fn
      }); // @ts-ignore


      this.register(hook);
    };
  }

  skipPlugins(pluginIds) {
    pluginIds.forEach(pluginId => {
      this.service.skipPluginIds.add(pluginId);
    });
  }

}

exports.default = PluginAPI;