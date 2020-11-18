import nodeExternals from 'webpack-node-externals';
export default {
    outputPath: './bundled/',
    target: 'node',
    externals: [nodeExternals()],
    entry: {
        webpackHotDevClient: './src/webpackHotDevClient/webpackHotDevClient',
    },
    nodeModulesTransform: {
        type: 'none',
    },
    devtool: false,
    define: {
        'process.env': {},
    },
};
