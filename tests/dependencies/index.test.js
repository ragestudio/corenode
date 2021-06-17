test("get all dependencies", () => {
    const script = require("../../packages/corenode/dist/dependencies/index")
    const dependencies = script.get()
    console.log(dependencies)
})