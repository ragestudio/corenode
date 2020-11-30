import { delay } from '@nodecorejs/libs';

export default {
  async chainWebpack(webpackConfig: any) {
    await delay(200);
    webpackConfig.resolve.alias.set('react', './react.ts');
    return webpackConfig;
  },
}
