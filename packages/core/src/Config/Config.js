import { existsSync } from 'fs';
import { extname, join } from 'path';
import { chalk, chokidar, compatESModuleRequire, deepmerge, cleanRequireCache, lodash, parseRequireDeps, winPath, getFile, createDebug, } from '@nodecorejs/utils';
import assert from 'assert';
import joi from '@hapi/joi';
import { ServiceStage } from '../Service/enums';
import { getUserConfigWithKey, updateUserConfigWithKey, } from './utils/configUtils';
import isEqual from './utils/isEqual';
import mergeDefault from './utils/mergeDefault';
import { getWachtedEnv } from '@nodecorejs/dot-runtime'

const debug = createDebug('nodecore:core:Config');
const CONFIG_FILES = getWachtedEnv()

export default class Config {
    constructor(opts) {
        this.cwd = opts.cwd || process.cwd();
        this.service = opts.service;
        this.localConfig = opts.localConfig;
    }
    async getDefaultConfig() {
        const pluginIds = Object.keys(this.service.plugins);
        let defaultConfig = pluginIds.reduce((memo, pluginId) => {
            const { key, config = {} } = this.service.plugins[pluginId];
            if ('default' in config)
                memo[key] = config.default;
            return memo;
        }, {});
        return defaultConfig;
    }
    getConfig({ defaultConfig }) {
        assert(this.service.stage >= ServiceStage.pluginReady, `Config.getConfig() failed, it should not be executed before plugin is ready.`);
        const userConfig = this.getUserConfig();
        const userConfigKeys = Object.keys(userConfig).filter((key) => {
            return userConfig[key] !== false;
        });
        const pluginIds = Object.keys(this.service.plugins);
        pluginIds.forEach((pluginId) => {
            const { key, config = {} } = this.service.plugins[pluginId];
            if (!config.schema)
                return;
            const value = getUserConfigWithKey({ key, userConfig });
            if (value === false) return;
            const schema = config.schema(joi);
            assert(joi.isSchema(schema), `schema return from plugin ${pluginId} is not valid schema.`);
            const { error } = schema.validate(value);
            if (error) {
                const e = new Error(`Validate config "${key}" failed, ${error.message}`);
                e.stack = error.stack;
                throw e;
            }
            const index = userConfigKeys.indexOf(key.split('.')[0]);
            if (index !== -1) {
                userConfigKeys.splice(index, 1);
            }
            if (key in defaultConfig) {
                const newValue = mergeDefault({
                    defaultConfig: defaultConfig[key],
                    config: value,
                });
                updateUserConfigWithKey({
                    key,
                    value: newValue,
                    userConfig,
                });
            }
        });
        if (userConfigKeys.length) {
            const keys = userConfigKeys.length > 1 ? 'keys' : 'key';
            throw new Error(`Invalid config ${keys}: ${userConfigKeys.join(', ')}`);
        }
        return userConfig;
    }
    getUserConfig() {
        const configFile = this.getConfigFile();
        this.configFile = configFile;
        if (configFile) {
            let envConfigFile;
            if (process.env.UMI_ENV) {
                const envConfigFileName = this.addAffix(configFile, process.env.UMI_ENV);
                const fileNameWithoutExt = envConfigFileName.replace(extname(envConfigFileName), '');
                envConfigFile = getFile({
                    base: this.cwd,
                    fileNameWithoutExt,
                    type: 'javascript',
                })?.filename;
                if (!envConfigFile) {
                    throw new Error(`get user config failed, ${envConfigFile} does not exist, but process.env.UMI_ENV is set to ${process.env.UMI_ENV}.`);
                }
            }
            const files = [
                configFile,
                envConfigFile,
                this.localConfig && this.addAffix(configFile, 'local'),
            ]
                .filter((f) => !!f)
                .map((f) => join(this.cwd, f))
                .filter((f) => existsSync(f));
            const requireDeps = files.reduce((memo, file) => {
                memo = memo.concat(parseRequireDeps(file));
                return memo;
            }, []);
            requireDeps.forEach(cleanRequireCache);
            this.service.babelRegister.setOnlyMap({
                key: 'config',
                value: requireDeps,
            });
            return this.mergeConfig(...this.requireConfigs(files));
        }
        else {
            return {};
        }
    }
    addAffix(file, affix) {
        const ext = extname(file);
        return file.replace(new RegExp(`${ext}$`), `.${affix}${ext}`);
    }
    requireConfigs(configFiles) {
        return configFiles.map((f) => compatESModuleRequire(require(f)));
    }
    mergeConfig(...configs) {
        let ret = {};
        for (const config of configs) {
            ret = deepmerge(ret, config);
        }
        return ret;
    }
    getConfigFile() {
        const configFile = CONFIG_FILES.find((f) => existsSync(join(this.cwd, f)));
        return configFile ? winPath(configFile) : null;
    }
    getWatchFilesAndDirectories() {
        const umiEnv = process.env.UMI_ENV;
        const configFiles = lodash.clone(CONFIG_FILES);
        CONFIG_FILES.forEach((f) => {
            if (this.localConfig)
                configFiles.push(this.addAffix(f, 'local'));
            if (umiEnv)
                configFiles.push(this.addAffix(f, umiEnv));
        });
        const configDir = winPath(join(this.cwd, 'config'));
        const files = configFiles
            .reduce((memo, f) => {
            const file = winPath(join(this.cwd, f));
            if (existsSync(file)) {
                memo = memo.concat(parseRequireDeps(file));
            }
            else {
                memo.push(file);
            }
            return memo;
        }, [])
            .filter((f) => !f.startsWith(configDir));
        return [configDir].concat(files);
    }
    watch(opts) {
        let paths = this.getWatchFilesAndDirectories();
        let userConfig = opts.userConfig;
        const watcher = chokidar.watch(paths, {
            ignoreInitial: true,
            cwd: this.cwd,
        });
        watcher.on('all', (event, path) => {
            console.log(chalk.green(`[${event}] ${path}`));
            const newPaths = this.getWatchFilesAndDirectories();
            const diffs = lodash.difference(newPaths, paths);
            if (diffs.length) {
                watcher.add(diffs);
                paths = paths.concat(diffs);
            }
            const newUserConfig = this.getUserConfig();
            const pluginChanged = [];
            const valueChanged = [];
            Object.keys(this.service.plugins).forEach((pluginId) => {
                const { key, config = {} } = this.service.plugins[pluginId];
                // recognize as key if have schema config
                if (!config.schema)
                    return;
                if (!isEqual(newUserConfig[key], userConfig[key])) {
                    const changed = {
                        key,
                        pluginId: pluginId,
                    };
                    if (newUserConfig[key] === false || userConfig[key] === false) {
                        pluginChanged.push(changed);
                    }
                    else {
                        valueChanged.push(changed);
                    }
                }
            });
            debug(`newUserConfig: ${JSON.stringify(newUserConfig)}`);
            debug(`oldUserConfig: ${JSON.stringify(userConfig)}`);
            debug(`pluginChanged: ${JSON.stringify(pluginChanged)}`);
            debug(`valueChanged: ${JSON.stringify(valueChanged)}`);
            if (pluginChanged.length || valueChanged.length) {
                opts.onChange({
                    userConfig: newUserConfig,
                    pluginChanged,
                    valueChanged,
                });
            }
            userConfig = newUserConfig;
        });
        return () => {
            watcher.close();
        };
    }
}
