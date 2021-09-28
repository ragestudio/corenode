
describe('corenode module.exports properties', () => {
    it('must return basic libraries', () => {
        const obj = require('../../packages/corenode/dist/index.js')
        basicExports.forEach((property) => {
            expect(obj).to.have.property(property)
        })
    })
})
