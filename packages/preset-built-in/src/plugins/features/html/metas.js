export default function (api) {
    api.describe({
        key: 'metas',
        config: {
            schema(joi) {
                return joi.array();
            },
        },
    });
    api.addHTMLMetas(() => {
        return api.config?.metas || [];
    });
}
