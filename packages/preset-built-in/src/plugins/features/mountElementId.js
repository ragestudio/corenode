export default (api) => {
    api.describe({
        key: 'mountElementId',
        config: {
            default: 'root',
            schema(joi) {
                return joi.string().allow('');
            },
        },
    });
};
