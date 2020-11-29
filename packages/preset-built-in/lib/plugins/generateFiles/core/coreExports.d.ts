import { IApi } from '@nodecorejs/types';
interface IUmiExport {
    source: string;
    exportAll?: boolean;
    specifiers?: any[];
}
export declare function generateExports({ item, coreExportsHook, }: {
    item: IUmiExport;
    coreExportsHook: object;
}): string;
export default function (api: IApi): void;
export {};
