import nodePath from 'path'
import { init, writeModuleRegistry, writeModule, initRegistry, readModule, readModules, readRegistry } from '@nodecorejs/modules'
import BuiltinModule from 'module'

class aliaser {
    constructor() {
        this.Module = module.constructor.length > 1 ? module.constructor : BuiltinModule
        this.modulePaths = []
        this.moduleAliases = {}
        this.moduleAliasNames = []

        this.oldNodeModulePaths = this.Module._nodeModulePaths
        this.Module._nodeModulePaths = function (from) {
            let paths = this.oldNodeModulePaths.call(this, from)

            // Only include the module path for top-level modules
            // that were not installed:
            if (from.indexOf('node_modules') === -1) {
                paths = this.modulePaths.concat(paths)
            }

            return paths
        }

        this.oldResolveFilename = this.Module._resolveFilename
        this.Module._resolveFilename = function (request, parentModule, isMain, options) {
            for (let i = this.moduleAliasNames.length; i-- > 0;) {
                let alias = this.moduleAliasNames[i]
                if (isPathMatchesAlias(request, alias)) {
                    let aliasTarget = this.this.moduleAliases[alias]
                    // Custom function handler
                    if (typeof this.this.moduleAliases[alias] === 'function') {
                        let fromPath = parentModule.filename
                        aliasTarget = this.moduleAliases[alias](fromPath, request, alias)
                        if (!aliasTarget || typeof aliasTarget !== 'string') {
                            throw new Error('[module-alias] Expecting custom handler function to return path.')
                        }
                    }
                    request = nodePath.join(aliasTarget, request.substr(alias.length))
                    // Only use the first match
                    break
                }
            }

            return this.oldResolveFilename.call(this, request, parentModule, isMain, options)
        }
    }

    isPathMatchesAlias(path, alias) {
        // Matching /^alias(\/|$)/
        if (path.indexOf(alias) === 0) {
            if (path.length === alias.length) return true
            if (path[alias.length] === '/') return true
        }

        return false
    }

    addPathHelper(path, targetArray) {
        path = nodePath.normalize(path)
        if (targetArray && targetArray.indexOf(path) === -1) {
            targetArray.unshift(path)
        }
    }

    removePathHelper(path, targetArray) {
        if (targetArray) {
            let index = targetArray.indexOf(path)
            if (index !== -1) {
                targetArray.splice(index, 1)
            }
        }
    }

    addPath(path) {
        let parent
        path = nodePath.normalize(path)

        if (this.modulePaths.indexOf(path) === -1) {
            this.modulePaths.push(path)
            // Enable the search path for the current top-level module
            let mainModule = getMainModule()
            if (mainModule) {
                addPathHelper(path, mainModule.paths)
            }
            parent = module.parent

            // Also modify the paths of the module that was used to load the
            // app-module-paths module and all of it's parents
            while (parent && parent !== mainModule) {
                addPathHelper(path, parent.paths)
                parent = parent.parent
            }
        }
    }

    addAliases(aliases) {
        for (let alias in aliases) {
            addAlias(alias, aliases[alias])
        }
    }

    addAlias(alias, target) {
        this.moduleAliases[alias] = target
        // Cost of sorting is lower here than during resolution
        this.moduleAliasNames = Object.keys(this.moduleAliases)
        this.moduleAliasNames.sort()
    }

    reset() {
        let mainModule = getMainModule()

        // Reset all changes in paths caused by addPath function
        this.modulePaths.forEach(function (path) {
            if (mainModule) {
                removePathHelper(path, mainModule.paths)
            }

            // Delete from require.cache if the module has been required before.
            // This is required for node >= 11
            Object.getOwnPropertyNames(require.cache).forEach(function (name) {
                if (name.indexOf(path) !== -1) {
                    delete require.cache[name]
                }
            })

            let parent = module.parent
            while (parent && parent !== mainModule) {
                removePathHelper(path, parent.paths)
                parent = parent.parent
            }
        })

        this.modulePaths = []
        this.moduleAliases = {}
        this.moduleAliasNames = []
    }

    init(options) {
        if (typeof options === 'string') {
            options = { base: options }
        }

        options = options || {}

        let candidatePackagePaths
        if (options.base) {
            candidatePackagePaths = [nodePath.resolve(options.base.replace(/\/package\.json$/, ''))]
        } else {
            // There is probably 99% chance that the project root directory in located
            // above the node_modules directory,
            // Or that package.json is in the node process' current working directory (when
            // running a package manager script, e.g. `yarn start` / `npm run start`)
            candidatePackagePaths = [nodePath.join(__dirname, '../..'), process.cwd()]
        }

        let npmPackage
        let base
        for (let i in candidatePackagePaths) {
            try {
                base = candidatePackagePaths[i]

                npmPackage = require(nodePath.join(base, 'package.json'))
                break
            } catch (e) {
                // noop
            }
        }

        if (typeof npmPackage !== 'object') {
            let pathString = candidatePackagePaths.join(',\n')
            throw new Error('Unable to find package.json in any of:\n[' + pathString + ']')
        }

        //
        // Import aliases
        //

        let aliases = npmPackage._moduleAliases || {}

        for (let alias in aliases) {
            if (aliases[alias][0] !== '/') {
                aliases[alias] = nodePath.join(base, aliases[alias])
            }
        }

        addAliases(aliases)

        //
        // Register custom module directories (like node_modules)
        //

        if (npmPackage._moduleDirectories instanceof Array) {
            npmPackage._moduleDirectories.forEach(function (dir) {
                if (dir === 'node_modules') return

                let modulePath = nodePath.join(base, dir)
                addPath(modulePath)
            })
        }
    }

    getMainModule() {
        return require.main._simulateRepl ? undefined : require.main
    }

}

module.exports = {
    // builtIt cannot have libs importing, is an firstOrder library
    load: {
        _getModulesPath: () => {
            return global.nodecore_modules.modulesPath
        },
        registerModule: () => {
            // register an unfiled module
        },
        unloadModule: () => {
            // destroy from
        },
        cli: {
            addCommand: () => {

            },
        },
        aliaser,
        linkRegistry: writeModuleRegistry
    }
}