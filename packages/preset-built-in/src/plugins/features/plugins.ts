import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'plugins',
    config: {
      schema(joi) {
        return joi.array().items(joi.string());
      },
    },
  });
};
