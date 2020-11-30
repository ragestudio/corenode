const { existsSync, writeFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { getGit } = require('@nodecorejs/dot-runtime')
const { yParser } = require('@nodecorejs/libs');
const getPackages = require('./utils/getPackages');

(async () => {
  const args = yParser(process.argv);
  const version = require('../lerna.json').version;

  const pkgs = getPackages();

  pkgs.forEach((packageName) => {
    const name = `@nodecorejs/${packageName}`;

    const pkgJSONPath = join(
      __dirname,
      '..',
      'packages',
      packageName,
      'package.json',
    );
    const pkgJSONExists = existsSync(pkgJSONPath);
    if (args.force || !pkgJSONExists) {
      const json = {
        name,
        version,
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        files: ['dist', 'src'],
        repository: {
          type: 'git',
          url: getGit(),
        },
        license: 'MIT',
        publishConfig: {
          access: 'public',
        },
      };
      if (pkgJSONExists) {
        const pkg = require(pkgJSONPath);
        [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'bin',
          'files',
          'authors',
          'types',
          'sideEffects',
          'main',
          'module',
        ].forEach((key) => {
          if (pkg[key]) json[key] = pkg[key];
        });
      }
      writeFileSync(pkgJSONPath, `${JSON.stringify(json, null, 2)}\n`);
    }

    if (packageName !== 'nodecore') {
      const readmePath = join(
        __dirname,
        '..',
        'packages',
        packageName,
        'README.md',
      );
      if (args.force || !existsSync(readmePath)) {
        writeFileSync(readmePath, `# ${name}\n`);
      }
    }
  });
})();
