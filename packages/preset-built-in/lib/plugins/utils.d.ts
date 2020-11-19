declare type IGetGlobalFile = (opts: {
    absSrcPath: string;
    files: string[];
}) => string[];
/**
 * get global file like (global.js, global.css)
 * @param absSrcPath
 * @param files default load global files
 */
export declare const getGlobalFile: IGetGlobalFile;
export declare const isDynamicRoute: (path: string) => boolean;
/**
 * judge whether ts or tsx file exclude d.ts
 * @param path
 */
export declare const isTSFile: (path: string) => boolean;
export {};
