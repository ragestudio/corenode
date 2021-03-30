const { getVersion } = require('../../packages/nodecorejs/dist/index.js')

test('getVersion', () => {
    expect(getVersion()).toBe("bruh")
})