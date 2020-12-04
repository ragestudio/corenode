import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

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
