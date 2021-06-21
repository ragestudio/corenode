import _path from 'path'
import fs from 'fs'
import _ from 'lodash'

export class moduleController {
    constructor(payload) {
        const { filename, aliases, paths } = payload ?? {}
        let Module = new module.constructor(filename)

        let overrides = {
            aliases: { ...aliases },
            paths: [...paths ?? []]
        }

        Module.overrides = overrides

        Module = override(Module, { aliases: overrides.aliases, paths: overrides.paths })

        Module.resolveFrom = (fromDirectory, moduleId) => {
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

            const resolveFileName = () => Module.constructor._resolveFilename(moduleId, {
                id: fromFile,
                filename: fromFile,
                paths: Module.constructor._nodeModulePaths(fromDirectory)
            })

            return resolveFileName()
        }

        Module.createRequire = function (from) {
            return (moduleId) => require(Module.resolveFrom(from, moduleId))
        }

        return Module
    }
}

export function override(instance, to = {}) {
    if (to.aliases) {
        instance.constructor = overrideResolveFilename(instance.constructor, to.aliases)
    }
    if (Array.isArray(to.paths)) {
        instance.constructor = overrideNodeModulesPath(instance.constructor, to.paths)
    }

    return instance
}

export function overrideResolveFilename(instance, to = {}) {
    const oldResolveFilename = instance._resolveFilename
    instance._resolveFilename = function (request, parentModule, isMain, options) {
        if (typeof (to[request]) !== "undefined") {
            request = to[request]
        }
        return oldResolveFilename.call(this, request, parentModule, isMain, options)
    }

    return instance
}

export function overrideNodeModulesPath(instance, to = []) {
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

export function createScopedRequire(instance, from) {
    return overrideResolveFilename(instance, instance.overrides?.filenames ?? {}).createRequire(_path.resolve(from ?? process.cwd(), 'anon.js'))
}