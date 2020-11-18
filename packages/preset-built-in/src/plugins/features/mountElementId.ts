import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'mountElementId',
    config: {
      default: 'root',
      schema(joi) {
        return joi.string().allow('');
      },
    },
  });
};
