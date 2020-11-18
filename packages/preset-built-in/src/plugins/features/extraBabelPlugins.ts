import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'extraBabelPlugins',
    config: {
      schema(joi) {
        return joi.array();
      },
    },
  });
};
