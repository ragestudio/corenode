// MIT License
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use babel';
import path from 'node:path';
import { locatePath, locatePathSync } from 'locate-path';

export const findUpStop = Symbol('findUpStop');

export async function findUp(name, options = {}) {
    let directory = path.resolve(options.cwd || '');
    const { root } = path.parse(directory);
    const paths = [name].flat();

    const runMatcher = async locateOptions => {
        if (typeof name !== 'function') {
            return locatePath(paths, locateOptions);
        }

        const foundPath = await name(locateOptions.cwd);
        if (typeof foundPath === 'string') {
            return locatePath([foundPath], locateOptions);
        }

        return foundPath;
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const foundPath = await runMatcher({ ...options, cwd: directory });

        if (foundPath === findUpStop) {
            return;
        }

        if (foundPath) {
            return path.resolve(directory, foundPath);
        }

        if (directory === root) {
            return;
        }

        directory = path.dirname(directory);
    }
}

export function findUpSync(name, options = {}) {
    let directory = path.resolve(options.cwd || '');
    const { root } = path.parse(directory);
    const paths = [name].flat();

    const runMatcher = locateOptions => {
        if (typeof name !== 'function') {
            return locatePathSync(paths, locateOptions);
        }

        const foundPath = name(locateOptions.cwd);
        if (typeof foundPath === 'string') {
            return locatePathSync([foundPath], locateOptions);
        }

        return foundPath;
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const foundPath = runMatcher({ ...options, cwd: directory });

        if (foundPath === findUpStop) {
            return;
        }

        if (foundPath) {
            return path.resolve(directory, foundPath);
        }

        if (directory === root) {
            return;
        }

        directory = path.dirname(directory);
    }
}

export {
    pathExists,
    pathExistsSync,
} from 'path-exists';