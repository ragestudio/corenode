import { IScriptConfig, IStyleConfig } from '@nodecorejs/types';
export interface IHTMLTag {
    [key: string]: string;
}
/**
 * 格式化 script => object
 * @param option Array<string | IScript>
 */
export declare const getScripts: (option: IScriptConfig) => IScriptConfig;
/**
 * 格式化 styles => [linkObject, styleObject]
 * @param option Array<string | ILink>
 */
export declare const getStyles: (option: IStyleConfig) => [IHTMLTag[], IHTMLTag[]];
