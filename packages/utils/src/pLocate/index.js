// MIT License
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
'use babel';

import pLimit from '../pLimit';

class EndError extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}

// The input can also be a promise, so we await it.
const testElement = async (element, tester) => tester(await element);

// The input can also be a promise, so we `Promise.all()` them both.
const finder = async element => {
    const values = await Promise.all(element);
    if (values[1] === true) {
        throw new EndError(values[0]);
    }

    return false;
};

export default async (
    iterable,
    tester,
    {
        concurrency = Number.POSITIVE_INFINITY,
        preserveOrder = true,
    } = {},
) => {
    const limit = pLimit(concurrency);

    // Start all the promises concurrently with optional limit.
    const items = [...iterable].map(element => [element, limit(testElement, element, tester)]);

    // Check the promises either serially or concurrently.
    const checkLimit = pLimit(preserveOrder ? 1 : Number.POSITIVE_INFINITY);

    try {
        await Promise.all(items.map(element => checkLimit(finder, element)));
    } catch (error) {
        if (error instanceof EndError) {
            return error.value;
        }

        throw error;
    }
}