export default {
    chainWebpack(webpackConfig) {
        webpackConfig.resolve.alias.set('react', './react.ts');
        return webpackConfig;
    },
};
