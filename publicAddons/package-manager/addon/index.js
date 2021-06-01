import child_process from 'child_process'

const installDependency = (params) => {
    return new Promise((resolve, reject) => {
        const packageJson = runtime.helpers.getRootPackage()

        if (typeof (packageJson.dependencies) !== "undefined") {
            if (packageJson.dependencies[`${params.pkg}`]) {
                return resolve(true)
            }
        }

        const npmi = child_process.exec(`npm install --quiet --no-progress --silent ${params.pkg}`, {}, (error, stdout, stderr) => {
            if (stdout) {
                console.log(stdout)
            }
            if (error) {
                console.log(error)
                return reject(error)
            }
            if (stderr) {
                console.log(stderr)
                return reject(stderr)
            }
        })

        npmi.on('exit', code => {
            return resolve(code)
        })
    })
}

const getDependencies = (dep) => {
    if (typeof dep !== "undefined") {
        
    }
}

expose = {
    getDependencies,
    installDependency
}