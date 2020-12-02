import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'inlineLimit',
    config: {
      schema(joi) {
        return joi.number();
      },
    },
  });
};
