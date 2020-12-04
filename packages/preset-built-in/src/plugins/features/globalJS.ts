import { relative } from 'path';
import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';
import { createDebug } from '@nodecorejs/libs';
import { getGlobalFile } from '../utils';

const debug = createDebug('nodecore:preset-build-in:global-js');

export default (api: IApi) => {
  const { paths } = api;
  const { absSrcPath = '', absTmpPath = '' } = paths;
  const files = ['global.tsx', 'global.ts', 'global.jsx', 'global.js'];
  const globalJSFile = getGlobalFile({ absSrcPath, files });
  debug('globalJSFile', globalJSFile);

  api.addEntryImportsAhead(() =>
    globalJSFile.map((file) => ({
      source: relative(absTmpPath, file),
    })),
  );
};
