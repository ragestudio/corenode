import { readFileSync } from 'fs';
import { join } from 'path';
import { IApi } from '@nodecorejs/types';
import { getFile, winPath } from '@nodecorejs/utils';
import { runtimePath } from '../constants';

export default function (api: IApi) {
  const {
    paths,
    utils: { Mustache },
  } = api;

  api.onGenerateFiles(async (args) => {
    const validKeys = await api.applyPlugins({
      key: 'addRuntimePluginKey',
      type: api.ApplyPluginsType.add,
      initialValue: [
        'modifyClientRenderOpts',
        'patchRoutes',
        'rootContainer',
        'render',
        'onRouteChange',
      ],
    });
    const plugins = await api.applyPlugins({
      key: 'addRuntimePlugin',
      type: api.ApplyPluginsType.add,
      initialValue: [
        getFile({
          base: paths.absSrcPath!,
          fileNameWithoutExt: 'app',
          type: 'javascript',
        })?.path,
      ].filter(Boolean),
    });
    api.writeTmpFile({
      path: 'core/plugin.ts',
      content: Mustache.render(
        readFileSync(join(__dirname, 'plugin.tpl'), 'utf-8'),
        {
          validKeys,
          runtimePath,
        },
      ),
    });
    api.writeTmpFile({
      path: 'core/pluginRegister.ts',
      content: Mustache.render(
        readFileSync(join(__dirname, 'pluginRegister.tpl'), 'utf-8'),
        {
          plugins: plugins.map((plugin: string, index: number) => {
            return {
              index,
              path: winPath(plugin),
            };
          }),
        },
      ),
    });
  });

  api.addcoreExports(() => {
    return {
      specifiers: ['plugin'],
      source: `./plugin`,
    };
  });
}
