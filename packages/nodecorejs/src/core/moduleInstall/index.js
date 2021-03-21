import fs from 'fs'
import path from 'path'

import { extract } from '../extract7z'
import temporalDir from '../temporalDir'
import { generateName } from '../ramdom'

export async function moduleInstall(_pathFile) {
    return new Promise(async (resolve, reject) => {
        console.log(generateName())

        if (typeof (_pathFile) == "undefined") {
            const err = `_pathFile is not defined`
            return reject(err)
        }
        if (!fs.existsSync(_pathFile)) {
            const err = `_pathFile not exists > [${_pathFile}]`
            return reject(err)
        }

        return

        const _extractDir = temporalDir.createNew(generateName())
        const _ext = _pathFile.split('.').pop()

        if (_ext === "7z") {
            await extract(_pathFile,)

            const manifestPath = path.resolve(_pathFile, `./manifest.json`)

            if (!fs.existsSync(manifestPath)) {
                const err = `manifest.json not exists > [${manifestPath}]`
                return reject(err)
            }

            const manifest = fs.readFile(manifestPath, 'utf-8')

        } else {
            const err = `File is not available. Failed download?`
            verbosity.options({ dumpFile: 'only' }).warn(err)
            return reject(err)
        }
    })
}

export default moduleInstall