import { relative } from 'path';
import { createDebug } from '@nodecorejs/utils';
import { getGlobalFile } from '../utils';
const debug = createDebug('umi:preset-build-in:global-js');
export default (api) => {
    const { paths } = api;
    const { absSrcPath = '', absTmpPath = '' } = paths;
    const files = ['global.tsx', 'global.ts', 'global.jsx', 'global.js'];
    const globalJSFile = getGlobalFile({ absSrcPath, files });
    debug('globalJSFile', globalJSFile);
    api.addEntryImportsAhead(() => globalJSFile.map((file) => ({
        source: relative(absTmpPath, file),
    })));
};
