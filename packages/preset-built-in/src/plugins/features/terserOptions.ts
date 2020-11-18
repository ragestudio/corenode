import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'terserOptions',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
};
