import { IApi, NextFunction, Request, Response } from '@nodecorejs/types';
declare const _default: ({ api, sharedMap, }: {
    api: IApi;
    sharedMap: Map<string, string>;
}) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default _default;
