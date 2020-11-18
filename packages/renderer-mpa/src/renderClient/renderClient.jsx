import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ApplyPluginsType } from '@nodecorejs/runtime';
function getRootContainer(opts) {
    for (const route of opts.routes) {
        if (route.path === opts.path)
            return route.component;
    }
}
export function renderClient(opts) {
    let path = opts.path;
    if (!path) {
        // @ts-ignore
        path = window.g_path;
    }
    // 暂不支持子路由
    for (const route of opts.routes) {
        if (route.routes) {
            throw new Error(`Render failed, child routes is not supported in mpa renderer.`);
        }
    }
    const RouteComponent = getRootContainer({ routes: opts.routes, path });
    if (!RouteComponent) {
        throw new Error(`Render failed, route of path ${path} not found.`);
    }
    const rootContainer = opts.plugin.applyPlugins({
        type: ApplyPluginsType.modify,
        key: 'rootContainer',
        initialValue: (<RouteComponent history={opts.history} routes={opts.routes} plugin={opts.plugin} defaultTitle={opts.defaultTitle}/>),
        args: {
            history: opts.history,
            routes: opts.routes,
            plugin: opts.plugin,
        },
    });
    if (opts.rootElement) {
        const rootElement = typeof opts.rootElement === 'string'
            ? document.getElementById(opts.rootElement)
            : opts.rootElement;
        const callback = opts.callback || (() => { });
        // @ts-ignore
        ReactDOM[window.g_useSSR ? 'hydrate' : 'render'](rootContainer, rootElement, callback);
    }
    else {
        return rootContainer;
    }
}
