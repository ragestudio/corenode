import getCircularReplacer from '../getCircularReplacer'

export default (obj) => {
    return JSON.stringify(obj, getCircularReplacer())
}