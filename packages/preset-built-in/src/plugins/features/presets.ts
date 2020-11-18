import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'presets',
    config: {
      schema(joi) {
        return joi.array().items(joi.string());
      },
    },
  });
};
