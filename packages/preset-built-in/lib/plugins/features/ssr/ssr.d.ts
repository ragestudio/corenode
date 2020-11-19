import { IApi } from '@nodecorejs/types';
/**
 * onBuildComplete for test case
 * replace default html template using client webpack bundle complete
 * @param api
 */
export declare const onBuildComplete: (api: IApi, _isTest?: boolean) => ({ err, stats, }: any) => Promise<string | undefined>;
declare const _default: (api: IApi) => void;
export default _default;
