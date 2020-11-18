import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'runtimePublicPath',
    config: {
      schema(joi) {
        return joi.boolean();
      },
    },
  });
};
