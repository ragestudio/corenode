import { parser } from '@nodecorejs/utils';
export function parse(code) {
    return parser.parse(code, {
        sourceType: 'module',
        plugins: [
            'jsx',
            'typescript',
            'classProperties',
            'dynamicImport',
            'exportDefaultFrom',
            'exportNamespaceFrom',
            'functionBind',
            'nullishCoalescingOperator',
            'objectRestSpread',
            'optionalChaining',
            'decorators-legacy',
        ],
        allowAwaitOutsideFunction: true,
    });
}
