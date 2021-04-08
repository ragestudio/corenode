const corenode = require('../dist')

test('Basic return properties', () => {
    expect(corenode).toHaveProperty('Runtime')
})
