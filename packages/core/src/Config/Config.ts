import { existsSync } from 'fs';
import { extname, join } from 'path';
import {
  chalk,
  chokidar,
  compatESModuleRequire,
  deepmerge,
  cleanRequireCache,
  lodash,
  parseRequireDeps,
  winPath,
  getFile,
  createDebug,
} from '@nodecorejs/libs';
import runtime from '@nodecorejs/dot-runtime'
import joi from '@hapi/joi';
import Service from '../Service/Service';
import { ServiceStage } from '../Service/enums';
import {
  getUserConfigWithKey,
  updateUserConfigWithKey,
} from './utils/configUtils';
import isEqual from './utils/isEqual';
import mergeDefault from './utils/mergeDefault';
// @ts-ignore
import { getWachtedEnv } from '@nodecorejs/dot-runtime'

const debug = createDebug('nodecore:core:Config');

interface IChanged {
  key: string;
  pluginId: string;
}

interface IOpts {
  cwd: string;
  service: Service;
  localConfig?: boolean;
}

const CONFIG_FILES = getWachtedEnv()

export default class Config {
  cwd: string;
  service: Service;
  config?: object;
  localConfig?: boolean;
  configFile?: string | null;

  constructor(opts: IOpts) {
    this.cwd = opts.cwd || process.cwd();
    this.service = opts.service;
    this.localConfig = opts.localConfig;
  }

  async getDefaultConfig() {
    const pluginIds = Object.keys(this.service.plugins);

    // collect default config
    let defaultConfig = pluginIds.reduce((memo, pluginId) => {
      const { key, config = {} } = this.service.plugins[pluginId];
      if ('default' in config) memo[key] = config.default;
      return memo;
    }, {});

    return defaultConfig;
  }

  getConfig({ defaultConfig }: { defaultConfig: object }) {
    const userConfig = this.getUserConfig();
    const userConfigKeys = Object.keys(userConfig).filter((key) => {
      return userConfig[key] !== false;
    });

    // get config
    const pluginIds = Object.keys(this.service.plugins);
    pluginIds.forEach((pluginId) => {
      const { key, config = {} } = this.service.plugins[pluginId];
      // recognize as key if have schema config
      if (!config.schema) return;

      const value = getUserConfigWithKey({ key, userConfig });
      if (value === false) return;

      const schema = config.schema(joi);
      const { error } = schema.validate(value);
      if (error) {
        const e = new Error(
          `Validate config "${key}" failed, ${error.message}`,
        );
        e.stack = error.stack;
        throw e;
      }

      // remove key
      const index = userConfigKeys.indexOf(key.split('.')[0]);
      if (index !== -1) {
        userConfigKeys.splice(index, 1);
      }

      // update userConfig with defaultConfig
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
    return runtime
  }

}
