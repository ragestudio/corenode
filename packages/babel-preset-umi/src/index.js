// @ts-ignore
import { mergeConfig } from '@nodecorejs/utils';
import { dirname } from 'path';
function toObject(obj) {
    return typeof obj === 'object' ? obj : {};
}
export default (context, opts = {}) => {
    const defaultEnvConfig = {
        exclude: [
            'transform-typeof-symbol',
            'transform-unicode-regex',
            'transform-sticky-regex',
            'transform-new-target',
            'transform-modules-umd',
            'transform-modules-systemjs',
            'transform-modules-amd',
            'transform-literals',
        ],
    };
    const preset = {
        presets: [
            opts.env && [
                require('@babel/preset-env').default,
                {
                    ...mergeConfig(defaultEnvConfig, toObject(opts.env)),
                    debug: opts.debug,
                },
            ],
            opts.react && [
                require('@babel/preset-react').default,
                toObject(opts.react),
            ],
            opts.typescript && [
                require('@babel/preset-typescript').default,
                {
                    // https://babeljs.io/docs/en/babel-plugin-transform-typescript#impartial-namespace-support
                    allowNamespaces: true,
                },
            ],
        ].filter(Boolean),
        plugins: [
            // https://github.com/webpack/webpack/issues/10227
            [
                require('@babel/plugin-proposal-optional-chaining').default,
                { loose: false },
            ],
            // https://github.com/webpack/webpack/issues/10227
            [
                require('@babel/plugin-proposal-nullish-coalescing-operator').default,
                { loose: false },
            ],
            require('@babel/plugin-syntax-top-level-await').default,
            // Necessary to include regardless of the environment because
            // in practice some other transforms (such as object-rest-spread)
            // don't work without it: https://github.com/babel/babel/issues/7215
            [
                require('@babel/plugin-transform-destructuring').default,
                { loose: false },
            ],
            // https://www.npmjs.com/package/babel-plugin-transform-typescript-metadata#usage
            // should be placed before @babel/plugin-proposal-decorators.
            opts.typescript && [
                require.resolve('babel-plugin-transform-typescript-metadata'),
            ],
            [require('@babel/plugin-proposal-decorators').default, { legacy: true }],
            [
                require('@babel/plugin-proposal-class-properties').default,
                { loose: true },
            ],
            require('@babel/plugin-proposal-export-default-from').default,
            [
                require('@babel/plugin-proposal-pipeline-operator').default,
                {
                    proposal: 'minimal',
                },
            ],
            require('@babel/plugin-proposal-do-expressions').default,
            require('@babel/plugin-proposal-function-bind').default,
            require('@babel/plugin-proposal-logical-assignment-operators').default,
            opts.transformRuntime && [
                require('@babel/plugin-transform-runtime').default,
                {
                    version: require('@babel/runtime/package.json').version,
                    // https://babeljs.io/docs/en/babel-plugin-transform-runtime#absoluteruntime
                    // lock the version of @babel/runtime
                    // make sure we are using the correct version
                    absoluteRuntime: dirname(require.resolve('@babel/runtime/package.json')),
                    // https://babeljs.io/docs/en/babel-plugin-transform-runtime#useesmodules
                    useESModules: true,
                    ...toObject(opts.transformRuntime),
                },
            ],
            opts.reactRemovePropTypes && [
                require.resolve('babel-plugin-transform-react-remove-prop-types'),
                {
                    removeImport: true,
                },
            ],
            opts.reactRequire && [require.resolve('babel-plugin-react-require')],
            opts.dynamicImportNode && [
                require.resolve('babel-plugin-dynamic-import-node'),
            ],
            opts.autoCSSModules && [
                require.resolve('@nodecorejs/babel-plugin-auto-css-modules'),
            ],
            opts.svgr && [
                require.resolve('babel-plugin-named-asset-import'),
                {
                    loaderMap: {
                        svg: {
                            ReactComponent: `${require.resolve('@svgr/webpack')}?-svgo,+titleProp,+ref![path]`,
                        },
                    },
                },
            ],
            ...(opts.import
                ? opts.import.map((importOpts) => {
                    return [
                        require.resolve('babel-plugin-import'),
                        importOpts,
                        importOpts.libraryName,
                    ];
                })
                : []),
            opts.importToAwaitRequire && [
                require.resolve('@nodecorejs/babel-plugin-import-to-await-require'),
                opts.importToAwaitRequire,
            ],
            opts.lockCoreJS3 && [
                require.resolve('@nodecorejs/babel-plugin-lock-core-js-3'),
                opts.lockCoreJS3,
            ],
        ].filter(Boolean),
    };
    return opts.modify ? opts.modify(preset) : preset;
};
