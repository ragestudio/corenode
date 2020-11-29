import winPath from './winPath/winPath';

function lastSlash(str: string) {
  return str[str.length - 1] === '/' ? str : `${str}/`;
}

interface IOpts {
  route: any;
  cwd?: string;
}
type IRouteToChunkName = (opts: IOpts) => string | undefined;

/**
 * transform route component into webpack chunkName
 * @param param0
 */
export const routeToChunkName: IRouteToChunkName = (
  { route, cwd } = { route: {} },
) => {
  return typeof route.component === 'string'
    ? route.component
        .replace(new RegExp(`^${lastSlash(winPath(cwd || '/'))}`), '')
        .replace(/^.(\/|\\)/, '')
        .replace(/(\/|\\)/g, '__')
        .replace(/\.jsx?$/, '')
        .replace(/\.tsx?$/, '')
        .replace(/^src__/, '')
        .replace(/\.\.__/g, '')
        .replace(/[\[\]]/g, '')
        .replace(/^.nodecore-production__/, 't__')
        .replace(/^pages__/, 'p__')
        .replace(/^page__/, 'p__')
    : '';
};
