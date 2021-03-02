import ora from 'ora'
import fs from 'fs'
import path from 'path'
import { getProyectEnv } from '../../../../builtin-lib/src/classes/Aliaser/node_modules/@nodecorejs/dot-runtime'

const temporalPath = getProyectEnv().temporalsDirectory ?? path.resolve(`${__dirname}/.nodecore_tmp`)
const spinner = ora({
    spinner: "dots",
    text: "Initalizing..."
})

export const temporalDir = {
    createNew: (name) => {
        let newTemporalPath = path.resolve(process.cwd(), `${temporalPath}/${name ?? ""}_${new Date().getTime()}`)

        if (!fs.existsSync(newTemporalPath)) {
            fs.mkdir(newTemporalPath, { recursive: true }, e => {
                if (e) throw new Error(e)
            })
            return newTemporalPath
        }
        return null
    },
    getTemporalsPath: () => {
        return temporalPath
    },
    clean: () => {
        spinner.start("Cleaning up temporal files...")
        fs.rmdirSync(temporalPath, { recursive: true })
        spinner.succeed()
    }
}

export default temporalDir