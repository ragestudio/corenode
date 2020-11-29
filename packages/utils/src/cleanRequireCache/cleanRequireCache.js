import { isWindows } from '../';
// 暂时无法使用 jest 进行单元测试，原因可参见
// https://github.com/facebook/jest/issues/5741
export default function (cacheKey) {
    const cachePath = isWindows ? cacheKey.replace(/\//g, '\\') : cacheKey;
    if (require.cache[cachePath]) {
        const cacheParent = require.cache[cachePath].parent;
        let i = cacheParent?.children.length || 0;
        while (i--) {
            if (cacheParent.children[i].id === cachePath) {
                cacheParent.children.splice(i, 1);
            }
        }
        delete require.cache[cachePath];
    }
}
