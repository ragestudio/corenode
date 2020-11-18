import { IConfig } from '@nodecorejs/types';

export default {
  ssr: {},
  history: { type: 'memory' },
  dynamicImport: {},
  routes: [
    { path: '/bar', component: 'Bar' },
    { path: '/', component: 'index' },
  ],
  mountElementId: '',
} as IConfig;
