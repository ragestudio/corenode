import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'autoprefixer',
    config: {
      default: {
        flexbox: 'no-2009',
      },
      schema(joi) {
        return joi
          .object()
          .description('postcss autoprefixer, default flexbox: no-2009');
      },
    },
  });
};
