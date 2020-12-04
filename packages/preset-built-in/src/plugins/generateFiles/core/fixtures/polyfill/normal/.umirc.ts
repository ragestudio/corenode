import { join, dirname } from "path";
import { pkgUp } from '@nodecorejs/libs';

export default {
  presets: [
    join(dirname(pkgUp.sync({
      cwd: __dirname
    })!), 'src/index.ts'),
  ],
}
