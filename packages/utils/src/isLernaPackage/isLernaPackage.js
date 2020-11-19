import { existsSync } from 'fs';
import { join } from 'path';
export default function (root) {
    return existsSync(join(root, 'lerna.json'));
}
