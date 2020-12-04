import { Service } from '@nodecorejs/core';
import { join } from 'path';
import { rimraf } from '@nodecorejs/libs';
import { existsSync } from 'fs';
const fixtures = join(__dirname, '../../../fixtures');
test('build', async () => {
    const cwd = join(fixtures, 'build');
    const service = new Service({
        cwd,
        presets: [require.resolve('../../../index.ts')],
    });
    await service.run({
        name: 'build',
    });
    expect(existsSync(join(cwd, 'dist', 'nodecore.js'))).toEqual(true);
    // expect(existsSync(join(cwd, 'dist', 'index.html'))).toEqual(true);
    rimraf.sync(join(cwd, 'dist'));
});
