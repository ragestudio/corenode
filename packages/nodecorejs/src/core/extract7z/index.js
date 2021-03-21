import sevenBin from '7zip-bin'
import { extractFull } from 'node-7z'
import { verbosity } from '@nodecorejs/utils'

export function extract(file, extractPath) {
    return new Promise((resolve, reject) => {
        const unpackStream = extractFull(file, extractPath, {
            $bin: sevenBin.path7za,
            $progress: true,
            recursive: true
        })

        unpackStream.on('progress', (progress) => {
            let printStr = `Extracting ${progress.filename ?? 'file ...'}`
            verbosity.dump(printStr)
        })

        unpackStream.on('end', () => {
            return resolve('end')
        })

        unpackStream.on('error', (err) => {
            verbosity.options({ dumpFile: 'only' }).error(err)
            return reject(err)
        })
    })
}

export default extractFull