import ejs from 'ejs';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import assert from 'assert';
import { cheerio } from '@nodecorejs/utils';
import prettier from 'prettier';
class Html {
    constructor(opts) {
        this.config = opts.config;
        this.tplPath = opts.tplPath;
    }
    getHtmlPath(path) {
        if (path === '/') {
            return 'index.html';
        }
        // remove first and last slash
        path = path.replace(/^\//, '');
        path = path.replace(/\/$/, '');
        if (this.config.exportStatic?.htmlSuffix || path === 'index.html') {
            return `${path}`;
        }
        else {
            return `${path}/index.html`;
        }
    }
    getRelPathToPublicPath(path) {
        const htmlPath = this.getHtmlPath(path);
        const len = htmlPath.split('/').length;
        return (Array(this.config.exportStatic?.htmlSuffix ? len : len - 1).join('../') ||
            './');
    }
    getAsset(opts) {
        if (/^https?:\/\//.test(opts.file)) {
            return opts.file;
        }
        const file = opts.file.charAt(0) === '/' ? opts.file.slice(1) : opts.file;
        if (this.config.exportStatic?.dynamicRoot) {
            return `${this.getRelPathToPublicPath(opts.path || '/')}${file}`;
        }
        else {
            return `${this.config.publicPath}${file}`;
        }
    }
    getScriptsContent(scripts) {
        return scripts
            .map((script) => {
            const { content, ...attrs } = script;
            if (content && !attrs.src) {
                const newAttrs = Object.keys(attrs).reduce((memo, key) => {
                    return [...memo, `${key}="${attrs[key]}"`];
                }, []);
                return [
                    `<script${newAttrs.length ? ' ' : ''}${newAttrs.join(' ')}>`,
                    content
                        .split('\n')
                        .map((line) => `  ${line}`)
                        .join('\n'),
                    '</script>',
                ].join('\n');
            }
            else {
                const newAttrs = Object.keys(attrs).reduce((memo, key) => {
                    return [...memo, `${key}="${attrs[key]}"`];
                }, []);
                return `<script ${newAttrs.join(' ')}></script>`;
            }
        })
            .join('\n');
    }
    async getContent(args) {
        const { route, tplPath = this.tplPath } = args;
        let { metas = [], links = [], styles = [], headJSFiles = [], headScripts = [], scripts = [], jsFiles = [], cssFiles = [], } = args;
        const { config } = this;
        if (tplPath) {
            assert(existsSync(tplPath), `getContent() failed, tplPath of ${tplPath} not exists.`);
        }
        const tpl = readFileSync(tplPath || join(__dirname, 'document.ejs'), 'utf-8');
        const context = {
            config,
            ...(config.exportStatic ? { route } : {}),
        };
        let html = ejs.render(tpl, context, {
            _with: false,
            localsName: 'context',
            filename: 'document.ejs',
        });
        let $ = cheerio.load(html, {
            decodeEntities: false,
        });
        // metas
        metas.forEach((meta) => {
            $('head').append([
                '<meta',
                ...Object.keys(meta).reduce((memo, key) => {
                    return memo.concat(`${key}="${meta[key]}"`);
                }, []),
                '/>',
            ].join(' '));
        });
        // links
        links.forEach((link) => {
            $('head').append([
                '<link',
                ...Object.keys(link).reduce((memo, key) => {
                    return memo.concat(`${key}="${link[key]}"`);
                }, []),
                '/>',
            ].join(' '));
        });
        // styles
        styles.forEach((style) => {
            const { content = '', ...attrs } = style;
            const newAttrs = Object.keys(attrs).reduce((memo, key) => {
                return memo.concat(`${key}="${attrs[key]}"`);
            }, []);
            $('head').append([
                `<style${newAttrs.length ? ' ' : ''}${newAttrs.join(' ')}>`,
                content
                    .split('\n')
                    .map((line) => `  ${line}`)
                    .join('\n'),
                '</style>',
            ].join('\n'));
        });
        // css
        cssFiles.forEach((file) => {
            $('head').append(`<link rel="stylesheet" href="${this.getAsset({
                file,
                path: route.path,
            })}" />`);
        });
        // root element
        const mountElementId = config.mountElementId || 'root';
        if (!$(`#${mountElementId}`).length) {
            const bodyEl = $('body');
            assert(bodyEl.length, `<body> not found in html template.`);
            bodyEl.append(`<div id="${mountElementId}"></div>`);
        }
        // js
        if (headScripts.length) {
            $('head').append(this.getScriptsContent(headScripts));
        }
        headJSFiles.forEach((file) => {
            $('head').append(`<script src="${this.getAsset({ file, path: route.path })}"></script>`);
        });
        if (scripts.length) {
            $('body').append(this.getScriptsContent(scripts));
        }
        jsFiles.forEach((file) => {
            $('body').append(`<script src="${this.getAsset({ file, path: route.path })}"></script>`);
        });
        if (args.modifyHTML) {
            $ = await args.modifyHTML($, { route });
        }
        html = $.html();
        // Node 8 not support prettier v2
        // https://github.com/prettier/eslint-plugin-prettier/issues/278
        try {
            html = prettier.format(html, {
                parser: 'html',
            });
        }
        catch (_) { }
        return html;
    }
}
export default Html;
