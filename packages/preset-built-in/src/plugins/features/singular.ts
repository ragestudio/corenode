import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'singular',
    config: {
      schema(joi) {
        return joi.boolean();
      },
    },
  });
};
