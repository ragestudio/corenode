import sevenBin from '7zip-bin'
import { extractFull } from 'node-7z'
import { verbosity } from '@corenode/utils'

export function extract(file, extractPath) {
    return new Promise((resolve, reject) => {
        const unpackStream = extractFull(file, extractPath, {
            $bin: sevenBin.path7za,
            $progress: true,
            recursive: true
        })

        unpackStream.on('progress', (progress) => {
            let printStr = `Extracting ${progress.filename ?? 'file ...'}`
            console.log(printStr)
        })

        unpackStream.on('end', () => {
            return resolve('end')
        })

        unpackStream.on('error', (err) => {
            process.runtime.logger.dump(err)
            verbosity.error(err)
            return reject(err)
        })
    })
}

export default extractFull