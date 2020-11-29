import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'version',
    description: 'show nodecore version',
    fn: async function () {},
  });
};
