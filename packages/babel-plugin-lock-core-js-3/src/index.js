import { dirname } from 'path';
import { t } from '@nodecorejs/utils';
const CORE_JS_PATH = dirname(require.resolve('core-js/package.json'));
export default function () {
    return {
        post({ path, opts }) {
            path.node.body.forEach((node) => {
                if (t.isImportDeclaration(node)) {
                    if (node.source.value.startsWith('core-js/')) {
                        node.source.value = node.source.value.replace(/^core-js\//, `${CORE_JS_PATH}/`);
                    }
                }
            });
        },
    };
}
