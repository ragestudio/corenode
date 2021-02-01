import axios from 'axios'
import fs from 'fs'

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
            }).catch((err) => {
                return reject(err.message)
            })
        }
    })
}