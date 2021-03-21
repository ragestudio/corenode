import fs from 'fs'
import path from 'path'

import { extract } from '../extract7z'
import temporalDir from '../temporalDir'
import { generateName } from '../random'

export async function moduleInstall(_pathFile) {
    return new Promise(async (resolve, reject) => {
        if (!path.isAbsolute(_pathFile)) {
            _pathFile = path.resolve(_pathFile)
        }
        if (typeof (_pathFile) == "undefined") {
            const err = `_pathFile is not defined`
            return reject(err)
        }
        if (!fs.existsSync(_pathFile)) {
            const err = `_pathFile not exists > [${_pathFile}]`
            return reject(err)
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
            return reject(err)
        }

        const manifest = fs.readFile(manifestPath, 'utf-8')
        console.log(manifest)
    })
}

export default moduleInstall