import assert from 'assert';
import * as utils from '@nodecorejs/utils';
import Logger from '../Logger/Logger';
import { isValidPlugin, pathToObj } from './utils/pluginUtils';
import { EnableBy, PluginType, ServiceStage } from './enums';
import Html from '../Html/Html';
export default class PluginAPI {
    constructor(opts) {
        this.id = opts.id;
        this.key = opts.key;
        this.service = opts.service;
        this.utils = utils;
        this.Html = Html;
        this.logger = new Logger(`umi:plugin:${this.id || this.key}`);
    }
    // TODO: reversed keys
    describe({ id, key, config, enableBy, } = {}) {
        const { plugins } = this.service;
        // this.id and this.key is generated automatically
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
        plugins[this.id].enableBy = enableBy || EnableBy.register;
    }
    register(hook) {
        assert(hook.key && typeof hook.key === 'string', `api.register() failed, hook.key must supplied and should be string, but got ${hook.key}.`);
        assert(hook.fn && typeof hook.fn === 'function', `api.register() failed, hook.fn must supplied and should be function, but got ${hook.fn}.`);
        this.service.hooksByPluginId[this.id] = (this.service.hooksByPluginId[this.id] || []).concat(hook);
    }
    registerCommand(command) {
        const { name, alias } = command;
        assert(!this.service.commands[name], `api.registerCommand() failed, the command ${name} is exists.`);
        this.service.commands[name] = command;
        if (alias) {
            this.service.commands[alias] = name;
        }
    }
    registerPresets(presets) {
        assert(this.service.stage === ServiceStage.initPresets, `api.registerPresets() failed, it should only used in presets.`);
        assert(Array.isArray(presets), `api.registerPresets() failed, presets must be Array.`);
        const extraPresets = presets.map((preset) => {
            return isValidPlugin(preset)
                ? preset
                : pathToObj({
                    type: PluginType.preset,
                    path: preset,
                    cwd: this.service.cwd,
                });
        });
        this.service._extraPresets.splice(0, 0, ...extraPresets);
    }
    registerPlugins(plugins) {
        assert(this.service.stage === ServiceStage.initPresets ||
            this.service.stage === ServiceStage.initPlugins, `api.registerPlugins() failed, it should only be used in registering stage.`);
        assert(Array.isArray(plugins), `api.registerPlugins() failed, plugins must be Array.`);
        const extraPlugins = plugins.map((plugin) => {
            return isValidPlugin(plugin)
                ? plugin
                : pathToObj({
                    type: PluginType.plugin,
                    path: plugin,
                    cwd: this.service.cwd,
                });
        });
        if (this.service.stage === ServiceStage.initPresets) {
            this.service._extraPlugins.push(...extraPlugins);
        }
        else {
            this.service._extraPlugins.splice(0, 0, ...extraPlugins);
        }
    }
    registerMethod({ name, fn, exitsError = true, }) {
        if (this.service.pluginMethods[name]) {
            if (exitsError) {
                throw new Error(`api.registerMethod() failed, method ${name} is already exist.`);
            }
            else {
                return;
            }
        }
        this.service.pluginMethods[name] =
            fn ||
                function (fn) {
                    const hook = {
                        key: name,
                        ...(utils.lodash.isPlainObject(fn) ? fn : { fn }),
                    };
                    // @ts-ignore
                    this.register(hook);
                };
    }
    skipPlugins(pluginIds) {
        pluginIds.forEach((pluginId) => {
            this.service.skipPluginIds.add(pluginId);
        });
    }
}
