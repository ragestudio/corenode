const { getRegistry, getLoadedModules } = process.runtime[0].modules

console.log(getRegistry())
