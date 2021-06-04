import _path from 'path'
import fs from 'fs'
import _ from 'lodash'

import { objectToArrayMap } from '@corenode/utils'

export class CustomModuleController {
    constructor(payload) {
        const { aliases, paths } = payload ?? {}
        let Module = _.clone(require("module"))

        Module.overrides = {
            filenames: {},
            paths: []
        }

        if (typeof aliases === "object") {
            objectToArrayMap(aliases).forEach((alias) => {
                Module.overrides.filenames[alias.key] = _path.resolve(alias.value)
            })
        }

        if (Array.isArray(paths)) {
            Module.overrides.paths = paths
        }

        Module = overrideResolveFilename(Module, Module.overrides.filenames)
        Module = overrideNodeModulesPath(Module, Module.overrides.paths)

        return Module
    }
}

export function overrideResolveFilename(instance, to = {}) {
    if (typeof (instance) !== "object") {
        throw new Error(`Instance must be an object`)
    }

    const oldResolveFilename = instance._resolveFilename
    instance._resolveFilename = function (request, parentModule, isMain, options) {
        if (typeof (to[request]) !== "undefined") {
            request = to[request]
        }
        return oldResolveFilename.call(this, request, parentModule, isMain, options)
    }

    instance.resolveFrom = (fromDirectory, moduleId) => {
        if (typeof fromDirectory !== 'string') {
            throw new TypeError(`Expected \`fromDir\` to be of type \`string\`, got \`${typeof fromDirectory}\``)
        }

        if (typeof moduleId !== 'string') {
            throw new TypeError(`Expected \`moduleId\` to be of type \`string\`, got \`${typeof moduleId}\``)
        }

        try {
            fromDirectory = fs.realpathSync(fromDirectory)
        } catch (error) {
            if (error.code === 'ENOENT') {
                fromDirectory = _path.resolve(fromDirectory)
            } else {
                throw error
            }
        }

        const fromFile = _path.join(fromDirectory, 'anon.js')

        const resolveFileName = () => instance._resolveFilename(moduleId, {
            id: fromFile,
            filename: fromFile,
            paths: instance._nodeModulePaths(fromDirectory)
        })

        return resolveFileName()
    }

    instance.createRequire = function (from) {
        return (moduleId) => require(instance.resolveFrom(from, moduleId))
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