import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'devtool',
    config: {
      schema(joi) {
        return joi.string();
      },
    },
  });
};
