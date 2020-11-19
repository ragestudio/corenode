import { existsSync } from 'fs';
import { join } from 'path';
/**
 * get global file like (global.js, global.css)
 * @param absSrcPath
 * @param files default load global files
 */
export const getGlobalFile = ({ absSrcPath, files }) => {
    return files
        .map((file) => join(absSrcPath || '', file))
        .filter((file) => existsSync(file))
        .slice(0, 1);
};
export const isDynamicRoute = (path) => !!path?.split('/')?.some?.((snippet) => snippet.startsWith(':'));
/**
 * judge whether ts or tsx file exclude d.ts
 * @param path
 */
export const isTSFile = (path) => {
    return (typeof path === 'string' &&
        !/\.d\.ts$/.test(path) &&
        /\.(ts|tsx)$/.test(path));
};
