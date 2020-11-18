export default (api) => {
    api.describe({
        key: 'dynamicImport',
        config: {
            schema(joi) {
                return joi
                    .object({
                    loading: joi
                        .string()
                        .description('loading the component before loaded'),
                })
                    .description('Code splitting for performance optimization');
            },
        },
    });
};
