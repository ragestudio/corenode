import axios from 'axios'
import fetch from 'node-fetch'
import fs from 'fs'

export function fetchRemotePkg(remoteSource, pkg, version, callback) {
    return new Promise((resolve, reject) => {
        if (!version) {
            version = "lastest"
        }
        if (!pkg) {
            return reject(`"pkg" Not provided`)
        }
        fetch(`${remoteSource}/${pkg}.json`)
            .catch(err => {
                return reject(err)
            })
            .then((res) => {
                if (res.status == 404) {
                    return reject(new Error(`❌ Package (${pkg}) not exist on remoteSource (${remoteSource})`))
                }
                if (res.status !== 200) {
                    return reject(new Error(`🛑 remoteSource (${remoteSource}) has responded with code ${res.status}`))
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

export function downloadWithPipe(address, filename, downloadPath) {
    return new Promise((resolve, reject) => {
        if (address && filename) {
            axios({
                method: "get",
                url: address,
                responseType: "stream"
            }).then((response) => {
                let writeStream = fs.createWriteStream(`${downloadPath}/${filename}`)
                response.data.pipe(writeStream)
                writeStream.on('finish', (data) => {
                    return resolve(data)
                })
            })
        }
    })
}
