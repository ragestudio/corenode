import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'styleLoader',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
};
