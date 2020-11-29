import { winPath } from '@nodecorejs/utils';
import { existsSync } from 'fs';
import { join } from 'path';
function getBasicBabelLoaderOpts({ cwd }) {
    const prefix = existsSync(join(cwd, 'src')) ? join(cwd, 'src') : cwd;
    return {
        // Tell babel to guess the type, instead assuming all files are modules
        // https://github.com/webpack/webpack/issues/4039#issuecomment-419284940
        sourceType: 'unambiguous',
        babelrc: false,
        cacheDirectory: process.env.BABEL_CACHE !== 'none'
            ? winPath(`${prefix}/.nodecore/.cache/babel-loader`)
            : false,
    };
}
export function getBabelPresetOpts(opts) {
    return {
        // @ts-ignore
        nodeEnv: opts.env,
        dynamicImportNode: !opts.config.dynamicImport,
        autoCSSModules: true,
        svgr: true,
        env: {
            targets: opts.targets,
        },
        import: [],
    };
}
export function getBabelOpts({ cwd, config, presetOpts, }) {
    return {
        ...getBasicBabelLoaderOpts({ cwd }),
        presets: [
            [require.resolve('@nodecorejs/babel-preset-umi/app'), presetOpts],
            ...(config.extraBabelPresets || []),
        ],
        plugins: [...(config.extraBabelPlugins || [])].filter(Boolean),
    };
}
export function getBabelDepsOpts({ env, cwd, config, }) {
    return {
        ...getBasicBabelLoaderOpts({ cwd }),
        presets: [
            [
                require.resolve('@nodecorejs/babel-preset-umi/dependency'),
                {
                    nodeEnv: env,
                    dynamicImportNode: !config.dynamicImport,
                },
            ],
        ],
    };
}
