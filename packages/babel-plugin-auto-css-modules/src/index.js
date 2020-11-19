import { extname } from 'path';
const CSS_EXTNAMES = ['.css', '.less', '.sass', '.scss', '.stylus', '.styl'];
export default function () {
    return {
        visitor: {
            ImportDeclaration(path, { opts }) {
                const { specifiers, source, source: { value }, } = path.node;
                if (specifiers.length && CSS_EXTNAMES.includes(extname(value))) {
                    source.value = `${value}?${opts.flag || 'modules'}`;
                }
            },
        },
    };
}
