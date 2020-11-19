import { relative } from 'path';
import { createDebug } from '@nodecorejs/utils';
import { getGlobalFile } from '../utils';
const debug = createDebug('umi:preset-build-in:global-css');
export default (api) => {
    const { paths, utils: { winPath }, } = api;
    const { absSrcPath = '', absTmpPath = '' } = paths;
    const files = [
        'global.css',
        'global.less',
        'global.scss',
        'global.sass',
        'global.styl',
        'global.stylus',
    ];
    const globalCSSFile = getGlobalFile({ absSrcPath, files });
    debug('globalCSSFile', globalCSSFile);
    api.addEntryCodeAhead(() => `${globalCSSFile
        .map((file) => `require('${winPath(relative(absTmpPath, file))}');`)
        .join('')}`);
};
