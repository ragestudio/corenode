import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'lessLoader',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
};
