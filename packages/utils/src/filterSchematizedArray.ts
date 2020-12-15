//@ts-ignore
export default function __proto__filterSchematizedArray(data) {
    //@ts-ignore
    let tmp = []
    return new Promise(resolve => {
        //@ts-ignore
        data.forEach(async (element) => {
            if (typeof (element.require) !== 'undefined') {
                //@ts-ignore
                const validRequire = await window.requireQuery(element.require)
                //@ts-ignore
                if (!window.requireQuery) {
                    //@ts-ignore
                    window.requireQuery = () => {
                        return true
                    }
                }
                //@ts-ignore
                validRequire ? tmp.push(element) : null
            } else {
                //@ts-ignore
                tmp.push(element)
            }
        })
        //@ts-ignore
        resolve(tmp)
    })
}