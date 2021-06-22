const basicExports = ["Runtime", "moduleLib", "logger"] 

const epic = requireFromSource("corenode/classes")

console.log(epic)

describe('corenode module.export properties', () => {
    it('must return basic libraries', () => {
        const obj = require('../../packages/corenode/dist/index.js')
        basicExports.forEach((property) => {
            expect(obj).to.have.property(property)
        })
    })
})
