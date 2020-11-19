import { delay } from '@nodecorejs/utils';
export default {
    async chainWebpack(webpackConfig) {
        await delay(200);
        webpackConfig.resolve.alias.set('react', './react.ts');
        return webpackConfig;
    },
};
