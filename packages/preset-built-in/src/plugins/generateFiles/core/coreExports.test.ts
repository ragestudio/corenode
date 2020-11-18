import { generateExports } from './coreExports';

test('export all', () => {
  const exportAll = generateExports({
    item: {
      exportAll: true,
      source: 'dva',
    },
    coreExportsHook: {},
  });
  expect(exportAll).toBe("export * from 'dva';");
});

test('export specifiers', () => {
  const exportSpecifiers = generateExports({
    item: {
      specifiers: ['connect'],
      source: 'dva',
    },
    coreExportsHook: {},
  });
  expect(exportSpecifiers).toBe("export { connect } from 'dva';");
});

test('export alias', () => {
  const exportAlias = generateExports({
    item: {
      specifiers: [{ local: 'default', exported: 'dva' }],
      source: 'dva',
    },
    coreExportsHook: {},
  });
  expect(exportAlias).toBe("export { default as dva } from 'dva';");
});

test('multiple', () => {
  const exportAlias = generateExports({
    item: {
      specifiers: ['a', { local: 'default', exported: 'b' }],
      source: 'dva',
    },
    coreExportsHook: {},
  });
  expect(exportAlias).toEqual("export { a, default as b } from 'dva';");
});

test('reserve library', () => {
  expect(() => {
    generateExports({
      item: {
        specifiers: [
          {
            local: 'default',
            exported: 'dva',
          },
        ],
        source: 'umi',
      },
      coreExportsHook: {},
    });
  }).toThrow("umi is reserve library, Please don't use it.");
});

test('reserve name', () => {
  expect(() => {
    generateExports({
      item: {
        specifiers: ['Link'],
        source: 'dva',
      },
      coreExportsHook: {},
    });
  }).toThrow("Link is reserve name, you can use 'exported' to set alias.");
});

test('repeated definition', () => {
  expect(() => {
    const coreExportsHook = {};
    generateExports({
      item: {
        specifiers: ['connect'],
        source: 'abc',
      },
      coreExportsHook,
    });
    generateExports({
      item: {
        specifiers: ['connect'],
        source: 'abc',
      },
      coreExportsHook,
    });
  }).toThrow("connect is Defined, you can use 'exported' to set alias.");
});
