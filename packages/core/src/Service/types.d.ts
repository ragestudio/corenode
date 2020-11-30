/// <reference types="hapi__joi" />
import joi from '@hapi/joi';
import { yargs } from '@nodecorejs/libs';
import { EnableBy } from './enums';
export declare type IServicePathKeys = 'cwd' | 'absNodeModulesPath' | 'absOutputPath' | 'absSrcPath' | 'absPagesPath' | 'absTmpPath';
export declare type IServicePaths = {
    [key in IServicePathKeys]: string;
};
export interface IDep {
    [name: string]: string;
}
export interface IPackage {
    name?: string;
    dependencies?: IDep;
    devDependencies?: IDep;
    [key: string]: any;
}
export interface IPlugin {
    id: string;
    key: string;
    path: string;
    apply: Function;
    config?: IPluginConfig;
    isPreset?: boolean;
    enableBy?: EnableBy | Function;
}
export interface IPluginConfig {
    default?: any;
    schema?: {
        (joi: joi.Root): joi.Schema;
    };
    onChange?: string | Function;
}
export interface IPreset extends IPlugin {
}
export interface IHook {
    key: string;
    fn: Function;
    pluginId?: string;
    before?: string;
    stage?: number;
}
export interface ICommand {
    name: string;
    alias?: string;
    description?: string;
    details?: string;
    fn: {
        ({ args }: {
            args: yargs.Arguments;
        }): void;
    };
}
