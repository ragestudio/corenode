import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'hash',
    config: {
      schema(joi) {
        return joi.boolean();
      },
    },
  });
};
