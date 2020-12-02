import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    // https://cssnano.co/optimisations/
    key: 'cssnano',
    config: {
      default: {
        mergeRules: false,
        minifyFontValues: { removeQuotes: false },
      },
      schema(joi) {
        return joi.object();
      },
    },
  });
};
