module.exports = function (api, opts) {
  return {
    presets: [
      [
        require('./dist').default,
        require('@nodecorejs/utils').deepmerge(
          {
            typescript: true,
            react: true,
            env: {
              targets: {
                node: 'current',
              },
              modules: 'commonjs',
            },
          },
          opts,
        ),
      ],
    ],
  };
};
