import { webpack } from '@nodecorejs/types';
interface IOpts {
    port: number;
    hostname: string;
    https?: boolean;
    onCompileDone: (args: {
        isFirstCompile: boolean;
        stats: webpack.Stats;
    }) => void;
    onCompileFail: (args: {
        stats: webpack.Stats;
    }) => void;
}
export default class DevCompileDonePlugin {
    opts: IOpts;
    constructor(opts: IOpts);
    apply(compiler: webpack.Compiler): void;
}
export {};
