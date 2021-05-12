import path from 'path'
import _ from 'lodash'

import { objectToArrayMap } from '@corenode/utils'

export class CustomNodeModuleController {
    constructor(aliases, paths) {
        let Module = _.clone(require("module"))

        Module.overrides = {
            filenames: {},
            paths: []
        }

        if (typeof (aliases) === "object") {
            objectToArrayMap(aliases).forEach((alias) => {
                Module.overrides.filenames[alias.key] = path.resolve(process.cwd(), alias.value)
            })
        }

        if (typeof (paths) === "object") {

        }

        Module = overrideNodeModulesPath(Module, Module.overrides.paths)
        Module = overrideResolveFilename(Module, Module.overrides.filenames)

        return Module
    }
}

export function overrideResolveFilename(instance, to = {}) {
    if (typeof (instance) !== "object") {
        throw new Error(`Instance must be an object`)
    }

    const oldResolveFilename = instance._origin_resolveFilename = instance._resolveFilename
    instance._resolveFilename = function (request, parentModule, isMain, options) {
        if (typeof (to[request]) !== "undefined") {
            request = to[request]
        }
        return oldResolveFilename.call(this, request, parentModule, isMain, options)
    }

    instance._autoCreatedRequire = instance.createRequire(process.cwd())
    instance._require = function (request) {
        if (typeof (to[request]) !== "undefined") {
            request = to[request]
        }
        return instance._autoCreatedRequire.call(this, request)
    }

    return instance
}

export function overrideNodeModulesPath(instance, to = []) {
    if (typeof (instance) !== "object") {
        throw new Error(`Instance must be an object`)
    }

    const oldNodeModulePaths = instance._origin_nodeModulePaths = instance._nodeModulePaths
    instance._nodeModulePaths = function (from) {
        let paths = oldNodeModulePaths.call(this, from)

        if (from.indexOf('node_modules') === -1) {
            paths = to.concat(paths)
        }
        return paths
    }

    return instance
}