import child_process from 'child_process'

import { getRootPackage } from '@nodecorejs/dot-runtime'
import { verbosity } from '@nodecorejs/utils'

export async function installDependency({params, caller}) {
    // to do: check version & auto update if not match
    // to do: add support for version selection
    return new Promise((resolve, reject) => {
        const localpackage = getRootPackage()
        if (typeof (localpackage.dependencies) !== "undefined") {
            if (localpackage.dependencies[`${params.pkg}`]) {
                verbosity.log(`${params.pkg} is already installed > ${localpackage.dependencies[`${params.pkg}`]}`)
                return resolve(true)
            }
        }

        verbosity.log(`Installing from npm > ${params.pkg} < Requested by (${caller})`)

        const npmi = child_process.exec(`npm install --quiet --no-progress --silent ${params.pkg}`, {}, (error, stdout, stderr) => {
            if (stdout) {
                verbosity.log(stdout)
            }
            if (error) {
                verbosity.log(stdout)
                return reject(error)
            }
        })

        npmi.on('exit', code => {
            return resolve(code)
        })
    })
}

export default installDependency