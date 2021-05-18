import fs from 'fs'
import path from 'path'

import { extract } from '../extract7z'
import temporalDir from '../temporalDir'
import { generateName } from '../random'

import { objectToArrayMap, verbosity } from '@corenode/utils'

const helpers = process.runtime.helpers
const addonController = process.runtime.addons

export async function addonInstall(_pathFile) {
    return new Promise(async (resolve, reject) => {
        if (typeof (_pathFile) == "undefined") {
            const err = `_pathFile is not defined`
            return reject(new Error(err))
        }
        if (!fs.existsSync(_pathFile)) {
            const err = `_pathFile not exists > [${_pathFile}]`
            return reject(new Error(err))
        }

        if (!path.isAbsolute(_pathFile)) {
            _pathFile = path.resolve(_pathFile)
        }

        const _extractDir = temporalDir.createNew(generateName())
        const _ext = _pathFile.split('.').pop()

        if (_ext === "7z") {
            await extract(_pathFile, _extractDir)
            _pathFile = _extractDir
        }

        const manifestPath = path.resolve(_pathFile, `./manifest.json`)

        if (!fs.existsSync(manifestPath)) {
            const err = `manifest.json not exists > [${manifestPath}]`
            return reject(new Error(err))
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        
        const { pkg, file, codec, version, dependencies, setup } = manifest

        if (typeof(pkg) == "undefined") {
            return reject(new Error(`Undefined [pkg]`))
        }
        if (typeof(file) == "undefined") {
            return reject(new Error(`Undefined [file]`))
        }

        let _manifestSetup = {
            pkg: pkg,
            version: version ?? "0.0.0",
            codec: codec ?? 'utf-8',
            file: file ?? path.resolve(_pathFile, "_addon.js"),
            dependencies: dependencies,
            setup: setup
        }

        if (_manifestSetup.dependencies) {
            if (Boolean(params?.ignoreDeps)) {
                verbosity.options({ dumpFile: true }).warn(`Ignoring dependencies installation`)
            } else {
                objectToArrayMap(_manifestSetup.dependencies).forEach((dep) => {
                    const isInstalled = helpers.isDependencyInstalled(dep.key) ? true : false
                    if (!isInstalled) {
                        helpers.addDependency(dep, true)
                    }
                })
            }
        }

        if (_manifestSetup.setup) {
            // TODO: Addon template setup
        }

        addonController.registryKey.add(_manifestSetup.pkg, _manifestSetup.version)

        return resolve(_manifestSetup)
    })
}

export default addonInstall