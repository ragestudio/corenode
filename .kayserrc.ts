import { readdirSync } from 'fs';
import { join } from 'path';

const headPkgs = ['dot-runtime', 'cli', 'nodecorejs', 'utils'];
const otherPkgs = readdirSync(join(__dirname, 'packages')).filter(
  (pkg) =>
    pkg.charAt(0) !== '.' && !headPkgs.includes(pkg)
);

export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  disableTypeCheck: true,
  pkgs: [...headPkgs, ...otherPkgs],
};