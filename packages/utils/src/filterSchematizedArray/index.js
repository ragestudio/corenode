//! Deprecated
export default function requireQueryFilter(data) {
    let tmp = []
    return new Promise(resolve => {
        data.forEach(async (element) => {
            if (typeof (element.require) !== 'undefined') {
                const validRequire = await window.requireQuery(element.require)
                if (!window.requireQuery) {
                    window.requireQuery = () => {
                        return true
                    }
                }
                validRequire ? tmp.push(element) : null
            } else {
                tmp.push(element)
            }
        })
        resolve(tmp)
    })
}