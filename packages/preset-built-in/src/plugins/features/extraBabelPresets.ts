import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'extraBabelPresets',
    config: {
      schema(joi) {
        return joi.array();
      },
    },
  });
};
