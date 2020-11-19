export default function (api) {
    api.describe({
        key: 'links',
        config: {
            schema(joi) {
                return joi.array();
            },
        },
    });
    api.addHTMLLinks(() => {
        return api.config?.links || [];
    });
}
