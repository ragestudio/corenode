import { defineConfig } from 'umi'
const nodeExternals = require('webpack-node-externals')

export default defineConfig({
  antd: {},
  dva: {
    hmr: true,
  },
  hash: true,
  history: {
    type: 'hash'
  },
  outputPath: '../../dist/renderer',
  externals: nodeExternals(),
})

// externals: function (context, request, callback) {
//   let isExternal = false;
//   const load = [
//     'electron',
//     'os',
//     'path',
//     'fs',
//     'child_process'
//   ];
//   if (load.includes(request)) {
//     isExternal = `require("${request}")`;
//   }
//   callback(null, isExternal);
// },