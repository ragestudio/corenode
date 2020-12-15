import child_process from 'child_process'

import { __FetchPKGFromRemote } from '../../utils/remotePkg'
import outputLog from '../../utils/outputLog'

import { getRootPackage } from '@nodecorejs/dot-runtime'


export async function __installPackage({params, caller}) {
    // to do: check version & auto update if not match
    // to do: add support for version selection
    return new Promise((resolve, reject) => {
        const localpackage = getRootPackage()
        if (typeof (localpackage.dependencies) !== "undefined") {
            if (localpackage.dependencies[`${params.pkg}`]) {
                outputLog.setCache(`${params.pkg} is already installed > ${localpackage.dependencies[`${params.pkg}`]}`)
                return resolve(true)
            }
        }

        outputLog.setCache(`Installing from npm > ${params.pkg} < Requested by (${caller})`)

        const npmi = child_process.exec(`npm install --quiet --no-progress --silent ${params.pkg}`, {}, (error, stdout, stderr) => {
            if (stdout) {
                outputLog.setCache(stdout)
            }
            if (error) {
                outputLog.setCache(error)
                return reject(error)
            }
        })

        npmi.on('exit', code => {
            outputLog.setCache(`npm installer exit with ${code}`)
            return resolve(code)
        })
    })
}