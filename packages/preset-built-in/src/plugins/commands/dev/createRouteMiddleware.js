import { Stream } from 'stream';
import { extname, join } from 'path';
import { matchRoutes } from 'react-router-config';
import { getHtmlGenerator } from '../htmlUtils';
const ASSET_EXTNAMES = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
export default ({ api, sharedMap, }) => {
    return async (req, res, next) => {
        async function sendHtml() {
            const html = getHtmlGenerator({ api });
            let route = { path: req.path };
            if (api.config.exportStatic) {
                const routes = (await api.getRoutes());
                const matchedRoutes = matchRoutes(routes, req.path);
                if (matchedRoutes.length) {
                    route = matchedRoutes[matchedRoutes.length - 1].route;
                }
            }
            const defaultContent = await html.getContent({
                route,
                chunks: sharedMap.get('chunks'),
            });
            const content = await api.applyPlugins({
                key: 'modifyDevHTMLContent',
                type: api.ApplyPluginsType.modify,
                initialValue: defaultContent,
                args: {
                    req,
                },
            });
            res.setHeader('Content-Type', 'text/html');
            // support stream content
            if (content instanceof Stream) {
                content.pipe(res);
                content.on('end', function () {
                    res.end();
                });
            }
            else {
                res.send(content);
            }
        }
        if (req.path === '/favicon.ico') {
            res.sendFile(join(__dirname, 'umi.png'));
        }
        else if (ASSET_EXTNAMES.includes(extname(req.path))) {
            next();
        }
        else {
            await sendHtml();
        }
    };
};
