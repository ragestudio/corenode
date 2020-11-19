import { readFileSync } from 'fs';
import { join } from 'path';
import { winPath } from '@nodecorejs/utils';
import { runtimePath, renderReactPath } from './constants';
export function importsToStr(imports) {
    return imports.map((imp) => {
        const { source, specifier } = imp;
        if (specifier) {
            return `import ${specifier} from '${winPath(source)}';`;
        }
        else {
            return `import '${winPath(source)}';`;
        }
    });
}
export default function (api) {
    const { utils: { Mustache }, } = api;
    api.addDepInfo(() => {
        return [
            {
                name: '@nodecorejs/runtime',
                range: '3',
                alias: [runtimePath],
            },
            {
                name: '@nodecorejs/renderer-react',
                range: '3',
                alias: [renderReactPath],
            },
        ];
    });
    api.onGenerateFiles(async (args) => {
        const umiTpl = readFileSync(join(__dirname, 'umi.tpl'), 'utf-8');
        const rendererPath = await api.applyPlugins({
            key: 'modifyRendererPath',
            type: api.ApplyPluginsType.modify,
            initialValue: renderReactPath,
        });
        api.writeTmpFile({
            path: 'umi.ts',
            content: Mustache.render(umiTpl, {
                // @ts-ignore
                enableTitle: api.config.title !== false,
                defaultTitle: api.config.title || '',
                rendererPath: winPath(rendererPath),
                runtimePath,
                rootElement: api.config.mountElementId,
                enableSSR: !!api.config.ssr,
                dynamicImport: !!api.config.dynamicImport,
                entryCode: (await api.applyPlugins({
                    key: 'addEntryCode',
                    type: api.ApplyPluginsType.add,
                    initialValue: [],
                })).join('\r\n'),
                entryCodeAhead: (await api.applyPlugins({
                    key: 'addEntryCodeAhead',
                    type: api.ApplyPluginsType.add,
                    initialValue: [],
                })).join('\r\n'),
                polyfillImports: importsToStr(await api.applyPlugins({
                    key: 'addPolyfillImports',
                    type: api.ApplyPluginsType.add,
                    initialValue: [],
                })).join('\r\n'),
                importsAhead: importsToStr(await api.applyPlugins({
                    key: 'addEntryImportsAhead',
                    type: api.ApplyPluginsType.add,
                    initialValue: [],
                })).join('\r\n'),
                imports: importsToStr(await api.applyPlugins({
                    key: 'addEntryImports',
                    type: api.ApplyPluginsType.add,
                    initialValue: [],
                })).join('\r\n'),
            }),
        });
    });
}
