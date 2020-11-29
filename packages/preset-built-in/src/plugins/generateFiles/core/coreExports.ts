import { IApi } from '@nodecorejs/types';
import { lodash, winPath } from '@nodecorejs/utils';
import assert from 'assert';

const reserveLibrarys = ['nodecore']; // reserve library
const reserveExportsNames = [
  'Link',
  'NavLink',
  'Redirect',
  'dynamic',
  'router',
  'withRouter',
  'Route',
];

interface IUmiExport {
  source: string;
  exportAll?: boolean;
  specifiers?: any[];
}

export function generateExports({
  item,
  coreExportsHook,
}: {
  item: IUmiExport;
  coreExportsHook: object;
}) {
  assert(item.source, 'source should be supplied.');
  assert(
    item.exportAll || item.specifiers,
    'exportAll or specifiers should be supplied.',
  );
  assert(
    !reserveLibrarys.includes(item.source),
    `${item.source} is reserve library, Please don't use it.`,
  );
  if (item.exportAll) {
    return `export * from '${winPath(item.source)}';`;
  }
  assert(
    Array.isArray(item.specifiers),
    `specifiers should be Array, but got ${item.specifiers!.toString()}.`,
  );
  const specifiersStrArr = item.specifiers!.map((specifier: any) => {
    if (typeof specifier === 'string') {
      assert(
        !reserveExportsNames.includes(specifier),
        `${specifier} is reserve name, you can use 'exported' to set alias.`,
      );
      assert(
        !coreExportsHook[specifier],
        `${specifier} is Defined, you can use 'exported' to set alias.`,
      );
      coreExportsHook[specifier] = true;
      return specifier;
    } else {
      assert(
        lodash.isPlainObject(specifier),
        `Configure item context should be Plain Object, but got ${specifier}.`,
      );
      assert(
        specifier.local && specifier.exported,
        'local and exported should be supplied.',
      );
      return `${specifier.local} as ${specifier.exported}`;
    }
  });
  return `export { ${specifiersStrArr.join(', ')} } from '${winPath(
    item.source,
  )}';`;
}

export default function (api: IApi) {
  api.onGenerateFiles(async () => {
    const coreExports = await api.applyPlugins({
      key: 'addcoreExports',
      type: api.ApplyPluginsType.add,
      initialValue: [],
    });

    let coreExportsHook = {}; // repeated definition
    api.writeTmpFile({
      path: 'core/coreExports.ts',
      content:
        coreExports
          .map((item: IUmiExport) => {
            return generateExports({
              item,
              coreExportsHook,
            });
          })
          .join('\n') + `\n`,
    });
  });
}
