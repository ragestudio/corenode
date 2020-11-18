import { IApi } from '@nodecorejs/types';
import { dirname } from 'path';
import { winPath, resolve } from '@nodecorejs/utils';

export default (api: IApi) => {
  const { paths, pkg, cwd } = api;

  api.describe({
    key: 'alias',
    config: {
      schema(joi) {
        return joi.object();
      },
      default: {
        'react-router': dirname(require.resolve('react-router/package.json')),
        'react-router-dom': dirname(
          require.resolve('react-router-dom/package.json'),
        ),
        history: dirname(require.resolve('history-with-query/package.json')),
      },
    },
  });

  function getUserLibDir({ library }: { library: string }) {
    if (
      (pkg.dependencies && pkg.dependencies[library]) ||
      (pkg.devDependencies && pkg.devDependencies[library]) ||
      (pkg.clientDependencies && pkg.clientDependencies[library])
    ) {
      return winPath(
        dirname(
          resolve.sync(`${library}/package.json`, {
            basedir: cwd,
          }),
        ),
      );
    }
    return null;
  }

  api.chainWebpack(async (memo) => {
    const libraries: {
      name: string;
      path: string;
    }[] = await api.applyPlugins({
      key: 'addProjectFirstLibraries',
      type: api.ApplyPluginsType.add,
      initialValue: [
        {
          name: 'react',
          path: dirname(require.resolve(`react/package.json`)),
        },
        {
          name: 'react-dom',
          path: dirname(require.resolve(`react-dom/package.json`)),
        },
      ],
    });
    libraries.forEach((library) => {
      memo.resolve.alias.set(
        library.name,
        getUserLibDir({ library: library.name }) || library.path,
      );
    });

    memo.resolve.alias.set('@', paths.absSrcPath as string);
    memo.resolve.alias.set('@@', paths.absTmpPath as string);

    return memo;
  });
};
