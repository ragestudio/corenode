import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'postcssLoader',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
};
