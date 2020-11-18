import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.chainWebpack((memo) => {
    if (process.env.UMI_DIR) {
      memo.resolve.alias.set('umi', process.env.UMI_DIR);
    }
    return memo;
  });
};
