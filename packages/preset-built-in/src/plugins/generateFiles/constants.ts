import { winPath } from '@nodecorejs/libs';
import { dirname } from 'path';

export const runtimePath = winPath(
  dirname(require.resolve('@nodecorejs/runtime/package.json')),
);
export const renderReactPath = winPath(
  require.resolve('@nodecorejs/renderer-react'),
);
