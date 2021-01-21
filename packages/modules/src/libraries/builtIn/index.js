import path from 'path'
import { init, writeModuleRegistry, writeModule, initRegistry, readModule, readModules, readRegistry } from '@nodecorejs/modules'

module.exports = {
    load: {
        _getModulesPath: () => {
            return global.nodecore_modules.modulesPath
        },
        registerModule: () =>{
            // register an unfiled module
        },
        unloadModule: () => {
            // destroy from
        },
        linkRegistry: writeModuleRegistry
    }
}