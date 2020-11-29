import { traverse } from '@nodecorejs/utils';
import { parse } from '../utils/parse';
export function isReactComponent(code) {
    const ast = parse(code);
    let hasJSXElement = false;
    traverse.default(ast, {
        JSXElement(path) {
            hasJSXElement = true;
            path.stop();
        },
        JSXFragment(path) {
            hasJSXElement = true;
            path.stop();
        },
    });
    return hasJSXElement;
}