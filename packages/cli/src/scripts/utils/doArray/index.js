export async function asyncDoArray(array, exec, callback) {
    return new Promise(async (resolve, reject) => {
        if (!array) {
            return reject("doArray is not provided")
        }
        if (!exec) {
            return reject("exec is not provided")
        }
        try {
            const keys = Object.keys(array)
            const values = Object.values(array)

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
            outputLog.setCache(error)
            return reject(error)
        }
    })
}