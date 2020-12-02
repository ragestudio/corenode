import { join, dirname } from 'path';
import { IApi } from '../../../../../../nodecorejs/src/node_modules/@nodecorejs/types';
import { Generator, chalk } from '@nodecorejs/libs';
import { writeFileSync } from 'fs';
import { getHtmlGenerator } from '../../htmlUtils';
import { mkdirp } from '@nodecorejs/libs';

export default function ({ api }: { api: IApi }) {
  return class PageGenerator extends Generator {
    constructor(opts: any) {
      super(opts);
    }

    async writing() {
      const jsExt = this.args.typescript ? '.tsx' : '.js';
      const cssExt = this.args.less ? '.less' : '.css';

      const html = getHtmlGenerator({ api });
      const content = await html.getContent({
        route: { path: (this.args.path as string) || '/' },
        noChunk: true,
      });
      const targetPath = join(api.paths.absOutputPath!, 'index.html');
      mkdirp.sync(dirname(targetPath));
      console.log(`${chalk.green('Write:')} dist/index.html`);
      writeFileSync(targetPath, content, 'utf-8');
    }
  };
}
