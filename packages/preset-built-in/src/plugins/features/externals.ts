import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'externals',
    config: {
      schema(joi) {
        // https://webpack.js.org/configuration/externals/#externals
        return joi.alternatives(joi.object(), joi.string(), joi.function());
      },
    },
  });
};
