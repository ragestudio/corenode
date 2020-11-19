export default (api) => {
    api.describe({
        key: 'runtimeHistory',
        config: {
            schema(joi) {
                return joi.object();
            },
        },
        onChange: api.ConfigChangeType.regenerateTmpFiles,
    });
};
