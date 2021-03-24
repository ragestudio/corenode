import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import { getPackages, getInstalledNodecoreDependencies, getRootPackage } from '../helpers'

let { verbosity, objectToArrayMap, readRootDirectorySync } = require('@nodecorejs/utils')
verbosity = verbosity.options({ method: `[MODULES]`, time: false })

let _modules = global.nodecore._modules = {}
let _libraries = global.nodecore._libraries = {}

export function getRegistry() {
    const fromPackageJSON = getRootPackage().modules
    console.log(fromPackageJSON)
    
}
