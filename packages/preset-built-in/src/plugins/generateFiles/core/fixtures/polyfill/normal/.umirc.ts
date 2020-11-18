import { join, dirname } from "path";
import { pkgUp } from '@nodecorejs/utils';

export default {
  presets: [
    join(dirname(pkgUp.sync({
      cwd: __dirname
    })!), 'src/index.ts'),
  ],
}
