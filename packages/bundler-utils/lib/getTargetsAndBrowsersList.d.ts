import { IConfig, ITargets, IBundlerConfigType } from '@nodecorejs/types';
interface IOpts {
    config: IConfig;
    type: IBundlerConfigType;
}
export default function ({ config, type }: IOpts): {
    targets: ITargets;
    browserslist: any;
};
export {};
