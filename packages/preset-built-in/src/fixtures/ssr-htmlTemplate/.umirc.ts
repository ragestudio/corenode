import { IConfig } from '@nodecorejs/types';

export default {
  ssr: {},
  history: { type: 'memory' },
  routes: [
    { path: '/', component: 'index' },
  ],
  mountElementId: '',
} as IConfig;
