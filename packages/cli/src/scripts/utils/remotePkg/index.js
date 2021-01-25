import fetch from 'node-fetch'

export function fetchRemotePkg(address, pkg, version, callback) {
    return new Promise((resolve, reject) => {
        if (!version) {
            version = "lastest"
        }
        if (!pkg) {
            return reject(`Package not provided!`)
        }
        fetch(`${address}/${pkg}.json`)
            .catch(err => {
                return reject(err)
            })
            .then((res) => {
                if (res.status == 404) {
                    return reject(new Error(`❌ Package (${pkg}) not exist (${address})`))
                }
                if (res.status !== 200) {
                    return reject(new Error(`🛑 Source (${address}) has responded with code ${res.status}`))
                }
                return res.json()
            })
            .then((res) => {
                if (res) {
                    if (version == "lastest") {
                        return resolve(callback(res[0]))
                    } else {
                        try {
                            res.forEach(e => {
                                if (e.version == version) {
                                    return resolve(callback(e))
                                }
                            })
                        } catch (error) {
                            return reject(error)
                        }
                    }
                }
            })
    })
}


