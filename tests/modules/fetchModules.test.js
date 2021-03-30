const modules = require('../packages/nodecorejs/dist/modules/index.js').default
const modulesController = new modules()

test('fetchModules', () => {
    const allModules = modulesController.fetchModules()
    expect(allModules).toHaveReturned()
})
