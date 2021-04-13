export default async (array) => {
    return new Promise(async (resolve, reject) => {
        if (Array.isArray(array)) {
            array.forEach(async (loop) => {
                try {
                    await loop()
                    return resolve()
                } catch (error) {
                    return reject(error)
                }
            })
        }
    })
}