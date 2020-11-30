import { Generator } from '@nodecorejs/libs';
import generateFiles from '../../generateFiles';
export default ({ api }) => {
    return class TmpGenerator extends Generator {
        constructor(opts) {
            super(opts);
        }
        async writing() {
            await generateFiles({
                api,
            });
        }
    };
};
