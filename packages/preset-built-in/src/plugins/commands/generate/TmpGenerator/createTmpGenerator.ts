import { IApi } from '@nodecorejs/types';
import { Generator } from '@nodecorejs/libs';
import generateFiles from '../../generateFiles';

export default ({ api }: { api: IApi }) => {
  return class TmpGenerator extends Generator {
    constructor(opts: any) {
      super(opts);
    }

    async writing() {
      await generateFiles({
        api,
      });
    }
  };
};
