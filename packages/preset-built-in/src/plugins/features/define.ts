import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'define',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
};
