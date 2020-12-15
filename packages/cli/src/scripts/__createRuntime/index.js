const saveRuntimeFile = ".nodecore"

import execa from 'execa'
import fs from 'fs'
import inquirer from 'inquirer'

import { getRuntimeEnv } from '@nodecorejs/dot-runtime'

const runtimeEnv = getRuntimeEnv()

export function __initCreateRuntime() {
    if (runtimeEnv) {
        console.log(`⚠ It seems this project has already been initialized previously, the parameters you enter will be replaced...`)
    }

    const prompts = [
        {
            name: "src",
            type: "input",
            message: "Source directory path (Relative) >",
            default: runtimeEnv.src ?? "/src"
        },
        {
            name: "add_basicframework",
            message: "Install basic framework >",
            type: "confirm"
        },
        {
            name: "init_npm",
            message: "You want to iniatilize npm proyect now >",
            type: "confirm"
        }
    ]

    inquirer.prompt(prompts)
        .then((answers)=> {
            if (!answers.src) {
                // missing source directory path, re-enter try
                return false
            }
            const nodecoreRuntimeString = {
                src: answers.src
            }

            fs.writeFile(saveRuntimeFile ?? '.nodecore', JSON.stringify(nodecoreRuntimeString, null, "\t"), function (err) {
                if (err) throw err;
                console.log('✳ Saved runtime file! >', saveRuntimeFile ?? '.nodecore');
            });

            if (answers.init_npm) {
                execa('npm', ['init']).stdout.pipe(process.stdout)
            }
        })
        .catch((error) => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                // Something else when wrong
            }
        });
}