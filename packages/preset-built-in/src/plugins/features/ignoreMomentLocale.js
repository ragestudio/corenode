export default (api) => {
    api.describe({
        key: 'ignoreMomentLocale',
        config: {
            schema(joi) {
                return joi.boolean();
            },
        },
    });
};
