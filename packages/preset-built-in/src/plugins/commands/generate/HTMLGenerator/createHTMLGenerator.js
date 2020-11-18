import { join, dirname } from 'path';
import { Generator, chalk } from '@nodecorejs/utils';
import { writeFileSync } from 'fs';
import { getHtmlGenerator } from '../../htmlUtils';
import { mkdirp } from '@nodecorejs/utils';
export default function ({ api }) {
    return class PageGenerator extends Generator {
        constructor(opts) {
            super(opts);
        }
        async writing() {
            const jsExt = this.args.typescript ? '.tsx' : '.js';
            const cssExt = this.args.less ? '.less' : '.css';
            const html = getHtmlGenerator({ api });
            const content = await html.getContent({
                route: { path: this.args.path || '/' },
                noChunk: true,
            });
            const targetPath = join(api.paths.absOutputPath, 'index.html');
            mkdirp.sync(dirname(targetPath));
            console.log(`${chalk.green('Write:')} dist/index.html`);
            writeFileSync(targetPath, content, 'utf-8');
        }
    };
}
