// MIT License
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
'use babel';

import process from 'node:process';
import path from 'node:path';
import { promises as fsPromises } from 'node:fs';
import pLocate from '../pLocate';

const typeMappings = {
    directory: 'isDirectory',
    file: 'isFile',
};

function checkType(type) {
    if (type in typeMappings) {
        return;
    }

    throw new Error(`Invalid type specified: ${type}`);
}

const matchType = (type, stat) => type === undefined || stat[typeMappings[type]]();

export default async (
    paths,
    {
        cwd = process.cwd(),
        type = 'file',
        allowSymlinks = true,
        concurrency,
        preserveOrder,
    } = {},
) => {
    checkType(type);

    const statFunction = allowSymlinks ? fsPromises.stat : fsPromises.lstat;

    return pLocate(paths, async path_ => {
        try {
            const stat = await statFunction(path.resolve(cwd, path_));
            return matchType(type, stat);
        } catch {
            return false;
        }
    }, { concurrency, preserveOrder });
}