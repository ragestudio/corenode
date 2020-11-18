import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'ignoreMomentLocale',
    config: {
      schema(joi) {
        return joi.boolean();
      },
    },
  });
};
