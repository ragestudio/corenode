import { join, basename } from 'path';
import { Generator, randomColor } from '@nodecorejs/libs';
export default function ({ api }) {
    return class PageGenerator extends Generator {
        constructor(opts) {
            super(opts);
        }
        async writing() {
            const [path] = this.args._;
            const jsExt = this.args.typescript ? '.tsx' : '.js';
            const cssExt = this.args.less ? '.less' : '.css';
            this.copyTpl({
                templatePath: join(__dirname, `page${jsExt}.tpl`),
                target: join(api.paths.absPagesPath, `${path}${jsExt}`),
                context: {
                    path,
                    name: basename(path),
                    cssExt,
                },
            });
            this.copyTpl({
                templatePath: join(__dirname, `page.css.tpl`),
                target: join(api.paths.absPagesPath, `${path}${cssExt}`),
                context: {
                    color: randomColor(),
                },
            });
        }
    };
}
