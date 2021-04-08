import fs from 'fs'
import path from 'path'

import { objectToArrayMap, verbosity } from '@nodecorejs/utils'

// import { writeModule } from '../../modules'
import { isDependencyInstalled, addDependency, loadRegistry } from '../../helpers'

import { extract } from '../extract7z'
import temporalDir from '../temporalDir'
import { generateName } from '../random'

export async function moduleInstall(_pathFile) {
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
        
        const { pkg, file, codec, dependencies } = manifest

        if (typeof(pkg) == "undefined") {
            return reject(new Error(`Undefined [pkg]`))
        }
        if (typeof(file) == "undefined") {
            return reject(new Error(`Undefined [file]`))
        }

        let _manifestSetup = {
            pkg: pkg,
            codec: codec ?? 'utf-8',
            file: file ?? path.resolve(_pathFile, "_module.js"),
            dependencies: dependencies,
        }

        if (_manifestSetup.dependencies) {
            if (Boolean(params?.ignoreDeps)) {
                verbosity.options({ dumpFile: true }).warn(`Ignoring dependencies installation`)
            } else {
                objectToArrayMap(_manifestSetup.dependencies).forEach((dep) => {
                    const isInstalled = isDependencyInstalled(dep.key) ? true : false
                    if (!isInstalled) {
                        addDependency(dep, true)
                    }
                })
            }
        }

        if (fs.existsSync()){

        }
        
        loadRegistry({ write: true })

        return resolve(_manifestSetup)
    })
}

export default moduleInstall