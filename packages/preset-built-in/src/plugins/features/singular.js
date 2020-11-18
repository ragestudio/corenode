export default (api) => {
    api.describe({
        key: 'singular',
        config: {
            schema(joi) {
                return joi.boolean();
            },
        },
    });
};
