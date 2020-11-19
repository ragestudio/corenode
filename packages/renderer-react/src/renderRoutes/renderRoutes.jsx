import React, { useEffect, useState } from 'react';
import { Redirect, ApplyPluginsType } from '@nodecorejs/runtime';
import Switch from './Switch';
import Route from './Route';
function wrapInitialPropsFetch(route, opts) {
    const { component, ...restRouteParams } = route;
    let Component = route.component;
    function ComponentWithInitialPropsFetch(props) {
        const [initialProps, setInitialProps] = useState(() => window.g_initialProps);
        useEffect(() => {
            /**
             * 1. 首次渲染时，此时 window.g_initialProps 变量存在，不需要再走一次 getInitialProps，这样一次 SSR 就走了 2 次 getInitialProps
             * 2. 但是路由切换时，window.getInitialProps 会被赋为 null，这时候就走 getInitialProps 逻辑
             * 3. 如果任何时候都走 2 次，配置 forceInitial: true，这个场景用于静态站点的首屏加载希望走最新数据
             * 4. 开启动态加载后，会在执行 getInitialProps 前预加载下
             */
            const handleGetInitialProps = async () => {
                // preload when enalbe dynamicImport
                if (Component.preload) {
                    const preloadComponent = await Component.preload();
                    // for test case, really use .default
                    Component = preloadComponent.default || preloadComponent;
                }
                const defaultCtx = {
                    isServer: false,
                    match: props?.match,
                    route,
                    ...(opts.getInitialPropsCtx || {}),
                    ...restRouteParams,
                };
                if (Component?.getInitialProps) {
                    const ctx = await opts.plugin.applyPlugins({
                        key: 'ssr.modifyGetInitialPropsCtx',
                        type: ApplyPluginsType.modify,
                        initialValue: defaultCtx,
                        async: true,
                    });
                    const initialProps = await Component.getInitialProps(ctx || defaultCtx);
                    setInitialProps(initialProps);
                }
            };
            // null 时，一定会触发 getInitialProps 执行
            if (window.g_initialProps === null) {
                handleGetInitialProps();
            }
        }, [window.location.pathname, window.location.search]);
        return <Component {...props} {...initialProps}/>;
    }
    // flag for having wrappered
    ComponentWithInitialPropsFetch.wrapInitialPropsLoaded = true;
    ComponentWithInitialPropsFetch.displayName = 'ComponentWithInitialPropsFetch';
    return ComponentWithInitialPropsFetch;
}
function render({ route, opts, props, }) {
    const routes = renderRoutes({
        ...opts,
        routes: route.routes || [],
        rootRoutes: opts.rootRoutes,
    });
    let { component: Component, wrappers } = route;
    if (Component) {
        const defaultPageInitialProps = opts.isServer
            ? {}
            : window.g_initialProps;
        const newProps = {
            ...props,
            ...opts.extraProps,
            ...(opts.pageInitialProps || defaultPageInitialProps),
            route,
            routes: opts.rootRoutes,
        };
        // @ts-ignore
        let ret = <Component {...newProps}>{routes}</Component>;
        // route.wrappers
        if (wrappers) {
            let len = wrappers.length - 1;
            while (len >= 0) {
                ret = React.createElement(wrappers[len], newProps, ret);
                len -= 1;
            }
        }
        return ret;
    }
    else {
        return routes;
    }
}
function getRouteElement({ route, index, opts }) {
    const routeProps = {
        key: route.key || index,
        exact: route.exact,
        strict: route.strict,
        sensitive: route.sensitive,
        path: route.path,
    };
    if (route.redirect) {
        return <Redirect {...routeProps} from={route.path} to={route.redirect}/>;
    }
    else {
        // avoid mount and unmount with url hash change
        if (
        // only when SSR config enable
        opts.ssrProps &&
            !opts.isServer &&
            // make sure loaded once
            !route.component?.wrapInitialPropsLoaded &&
            (route.component?.getInitialProps || route.component?.preload)) {
            // client Render for enable ssr, but not sure SSR success
            route.component = wrapInitialPropsFetch(route, opts);
        }
        return (<Route {...routeProps} render={(props) => {
            return render({ route, opts, props });
        }}/>);
    }
}
export default function renderRoutes(opts) {
    return opts.routes ? (<Switch>
      {opts.routes.map((route, index) => getRouteElement({
        route,
        index,
        opts: {
            ...opts,
            rootRoutes: opts.rootRoutes || opts.routes,
        },
    }))}
    </Switch>) : null;
}
