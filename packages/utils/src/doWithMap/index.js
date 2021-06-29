export default async (map, exec, callback) => {
    return new Promise(async (resolve, reject) => {
        if (!map) {
            return reject("array is not provided")
        }
        if (!exec && typeof (exec) == "function") {
            return reject("exec is not provided/valid")
        }
        try {
            const keys = Object.keys(map)
            const values = Object.values(map)

            for (let index = 0; index < keys.length; index++) {
                const key = keys[index]
                const value = values[index]

                await exec(key, value)

                if (index == (keys.length - 1)) {
                    if (typeof (callback) !== "undefined") {
                        callback(false, true)
                    }
                    return resolve()
                }

            }
        } catch (error) {
            if (typeof (callback) !== "undefined") {
                callback(error, false)
            }
            return reject(error)
        }
    })
}