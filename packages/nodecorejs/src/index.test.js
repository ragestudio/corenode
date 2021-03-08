const nodecore = require('../dist')

test('Basic return properties', () => {
    expect(nodecore).toHaveProperty('modules')
})
