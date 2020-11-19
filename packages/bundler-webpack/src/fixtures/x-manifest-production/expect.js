import { join } from 'path';
import { readFileSync } from 'fs';
export default ({ files, cwd }) => {
    expect(files).toContain(`asset-manifest.json`);
    expect(readFileSync(join(cwd, 'dist/asset-manifest.json'), 'utf-8')).toContain(`"index.js": "/foo/index.js"`);
};
