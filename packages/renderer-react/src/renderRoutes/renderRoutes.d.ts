/// <reference types="react" />
import { Plugin } from '@nodecorejs/runtime';
import { IRoute } from '..';
interface IOpts {
    routes: IRoute[];
    plugin: Plugin;
    extraProps?: object;
    pageInitialProps?: object;
    getInitialPropsCtx?: object;
    isServer?: boolean;
    ssrProps?: object;
    rootRoutes?: IRoute[];
}
export default function renderRoutes(opts: IOpts): JSX.Element | null;
export {};
