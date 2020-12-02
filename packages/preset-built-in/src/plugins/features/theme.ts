import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'theme',
    config: {
      schema(joi) {
        return joi.object().pattern(joi.string(), joi.string());
      },
    },
  });
};
