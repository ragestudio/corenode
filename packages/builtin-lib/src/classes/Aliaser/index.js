import path from 'path'
import fs from 'fs'

import BuiltinModule from 'module'
import { objectToArrayMap } from '@nodecorejs/utils'
import { getRootPackage } from '@nodecorejs/dot-runtime'

const aliaserRegistryFile = `.aliaser`

export class Aliaser {
    constructor(aliases) {
        this.Registry = {}
        this.RegistryPath = path.resolve(process.cwd(), aliaserRegistryFile)
        this.RegistryCodec = 'utf-8'

        this.Module = module.constructor.length > 1 ? module.constructor : BuiltinModule

        this.init(aliases)

        this.oldResolveFilename = this.Module._resolveFilename
        this.Module._resolveFilename = function (request, parentModule, isMain, options) {
            if (typeof (this.Registry[request]) !== "undefined") {
                request = this.Registry[request]
            }
            return this.oldResolveFilename.call(this, request, parentModule, isMain, options)
        }.bind(this)
    }

    init(entries = {}) {
        const { dependencies, devDependencies } = getRootPackage()
        const npmDependencies = { ...dependencies, ...devDependencies }

        // link all dependencies from npm package
        objectToArrayMap(npmDependencies).forEach((alias) => {
            this.Registry[alias.key] = path.resolve(process.cwd(), `node_modules/${alias.key}`)
        })
        // link customs aliases
        objectToArrayMap(entries).forEach((alias) => {
            this.Registry[alias.key] = path.resolve(process.cwd(), alias.value)
        })

        fs.writeFileSync(this.RegistryPath, JSON.stringify(this.Registry, null, 2), this.RegistryCodec)
    }
}

export default Aliaser