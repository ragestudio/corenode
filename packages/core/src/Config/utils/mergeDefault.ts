import { deepmerge, lodash } from '@nodecorejs/libs';

interface IOpts {
  defaultConfig: any;
  config: any;
}

export default ({ defaultConfig, config }: IOpts) => {
  if (lodash.isPlainObject(defaultConfig) && lodash.isPlainObject(config)) {
    return deepmerge(defaultConfig, config);
  }
  return typeof config !== 'undefined' ? config : defaultConfig;
};
