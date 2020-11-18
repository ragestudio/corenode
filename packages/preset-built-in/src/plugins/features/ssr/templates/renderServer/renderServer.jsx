import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { matchRoutes } from 'react-router-config';
import { StaticRouter, ApplyPluginsType, } from '@nodecorejs/runtime';
import { renderRoutes } from '@nodecorejs/renderer-react';
/**
 * get current page component getPageInitialProps data
 * @param params
 */
export const loadPageGetInitialProps = async ({ ctx, opts, }) => {
    const { routes, pathname = opts.path } = opts;
    // via {routes} to find `getInitialProps`
    const routesMatched = matchRoutes(routes, pathname || '/');
    const promises = routesMatched
        .map(async ({ route, match }) => {
        const { component, ...restRouteParams } = route;
        let Component = component;
        // preload for dynamicImport
        if (Component?.preload) {
            const preloadComponent = await Component.preload();
            Component = preloadComponent.default || preloadComponent;
        }
        if (Component && Component?.getInitialProps) {
            // handle ctx
            ctx = Object.assign(ctx, { match, route, ...restRouteParams });
            return Component.getInitialProps
                ? await Component.getInitialProps(ctx)
                : {};
        }
    })
        .filter(Boolean);
    const pageInitialProps = (await Promise.all(promises)).reduce((acc, curr) => Object.assign({}, acc, curr), {});
    return {
        pageInitialProps,
        routesMatched,
    };
};
/**
 * 处理 getInitialProps、路由 StaticRouter、数据预获取
 * @param opts
 */
function getRootContainer(opts) {
    const { path, context, basename = '/', ...renderRoutesProps } = opts;
    return renderRoutesProps.plugin.applyPlugins({
        type: ApplyPluginsType.modify,
        key: 'rootContainer',
        initialValue: (<StaticRouter basename={basename === '/' ? '' : basename} location={path} context={context}>
        {renderRoutes(renderRoutesProps)}
      </StaticRouter>),
        args: {
            type: 'ssr',
            history: opts.history,
            routes: opts.routes,
            plugin: opts.plugin,
        },
    });
}
/**
 * 服务端渲染处理，通过 `routes` 来做 页面级 数据预获取
 *
 * @param opts
 */
export default async function renderServer(opts) {
    const defaultCtx = {
        isServer: true,
        // server only
        history: opts.history,
        ...(opts.getInitialPropsCtx || {}),
    };
    // modify ctx
    const ctx = await opts.plugin.applyPlugins({
        key: 'ssr.modifyGetInitialPropsCtx',
        type: ApplyPluginsType.modify,
        initialValue: defaultCtx,
        async: true,
    }) || defaultCtx;
    // get pageInitialProps
    const { pageInitialProps, routesMatched } = await loadPageGetInitialProps({
        ctx,
        opts
    });
    const rootContainer = getRootContainer({
        ...opts,
        pageInitialProps,
    });
    if (opts.mode === 'stream') {
        const pageHTML = ReactDOMServer[opts.staticMarkup ? 'renderToStaticNodeStream' : 'renderToNodeStream'](rootContainer);
        return {
            pageHTML,
            pageInitialProps,
            routesMatched,
        };
    }
    const pageHTML = ReactDOMServer[opts.staticMarkup ? 'renderToStaticMarkup' : 'renderToString'](rootContainer);
    // by default
    return {
        pageHTML,
        pageInitialProps,
        routesMatched,
    };
}
