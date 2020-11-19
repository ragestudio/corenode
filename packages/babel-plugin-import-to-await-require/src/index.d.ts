import * as traverse from '@babel/traverse';
declare type TLibs = (RegExp | string)[];
interface IAlias {
    [key: string]: string;
}
export interface IOpts {
    libs: TLibs;
    remoteName: string;
    alias?: IAlias;
    onTransformDeps?: Function;
}
export declare function specifiersToProperties(specifiers: any[]): any;
export default function (): {
    visitor: traverse.Visitor<{}>;
};
export {};
