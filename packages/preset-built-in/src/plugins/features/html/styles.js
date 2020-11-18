import { getStyles } from './utils';
export default function (api) {
    api.describe({
        key: 'styles',
        config: {
            schema(joi) {
                return joi.array();
            },
        },
    });
    const { styles = [] } = api.service.userConfig || {};
    const [linkArr = [], styleArr = []] = getStyles(styles);
    api.addHTMLStyles(() => styleArr);
    api.addHTMLLinks(() => linkArr);
}
