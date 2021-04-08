import ora from 'ora'
import fs from 'fs'
import path from 'path'
import { getProjectEnv } from '../../index'

const temporalPath = getProjectEnv()?.temporalsDirectory ?? path.resolve(`${process.cwd()}/.nodecore_tmp`)
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