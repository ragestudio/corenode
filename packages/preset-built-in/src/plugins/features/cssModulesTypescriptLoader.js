export default (api) => {
    api.describe({
        key: 'cssModulesTypescriptLoader',
        config: {
            schema(joi) {
                return joi.object({
                    mode: joi.string().valid('emit', 'verify').optional(),
                });
            },
        },
    });
};
