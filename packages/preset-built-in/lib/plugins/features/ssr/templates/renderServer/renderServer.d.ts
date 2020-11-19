/// <reference types="node" />
import React from 'react';
import { Stream } from 'stream';
import { Plugin, MemoryHistory } from '@nodecorejs/runtime';
import { IRoute } from '@nodecorejs/types';
export interface IOpts {
    path: string;
    history: MemoryHistory;
    basename: string;
    pathname: string;
    plugin: Plugin;
    routes: IRoute[];
    getInitialPropsCtx?: object;
    initialData?: any;
    context?: object;
    mode?: 'stream' | 'string';
    staticMarkup?: boolean;
    /** unused */
    [key: string]: any;
}
export interface ILoadGetInitialPropsValue {
    pageInitialProps: any;
    routesMatched?: IRoute[];
}
interface ILoadGetInitialPropsOpts extends IOpts {
    App?: React.ReactElement;
}
interface IContext {
    isServer: boolean;
    history: MemoryHistory;
    match?: any;
    [key: string]: any;
}
/**
 * get current page component getPageInitialProps data
 * @param params
 */
export declare const loadPageGetInitialProps: ({ ctx, opts, }: {
    ctx: IContext;
    opts: ILoadGetInitialPropsOpts;
}) => Promise<ILoadGetInitialPropsValue>;
interface IRenderServer extends ILoadGetInitialPropsValue {
    pageHTML: string | Stream;
}
/**
 * 服务端渲染处理，通过 `routes` 来做 页面级 数据预获取
 *
 * @param opts
 */
export default function renderServer(opts: IOpts): Promise<IRenderServer>;
export {};
