import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.chainWebpack((memo) => {
    if (process.env.UMI_DIR) {
      memo.resolve.alias.set('nodecore', process.env.UMI_DIR);
    }
    return memo;
  });
};
