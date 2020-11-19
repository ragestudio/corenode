import { IApi } from '@nodecorejs/types';
export default function ({ api }: {
    api: IApi;
}): {
    new (opts: any): {
        writing(): Promise<void>;
        cwd: string;
        args: {
            [argName: string]: unknown;
            _: string[];
            $0: string;
        };
        run(): Promise<void>;
        copyTpl(opts: {
            templatePath: string;
            target: string;
            context: object;
        }): void;
        copyDirectory(opts: {
            path: string;
            context: object;
            target: string;
        }): void;
    };
};
