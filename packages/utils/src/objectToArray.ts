import isNonNegativeInteger from './isNonNegativeInteger'

interface Obj {
  [k: number]: any,
}

/**
 * Takes all values matching non-negative integer keys in an object
 * and puts them in an array
 */
export function objectToArray<obj extends Readonly<Obj>, V extends obj[keyof obj]>(payload: obj) {
  const indices = Object.keys(payload)
    .map(Number)
    .filter(isNonNegativeInteger)

  const minKey = Math.min(...indices)
  const maxKey = Math.max(...indices)
  const arr: V[] = []

  for (let i = minKey; i <= maxKey; ++i) {
    arr[i] = payload[i]
  }

  return arr
}

export function objectToArrayMap<obj extends Readonly<Obj>>(payload: obj) {
  if (!payload) return false
  let tmp = []

  const keys = Object.keys(payload)
  const values = Object.values(payload)
  const sourceLength = keys.length

  for (let i = 0; i < sourceLength; i++) {
    let obj = {
      key: "",
      value: null
    }
    obj.key = keys[i]
    obj.value = values[i]
    tmp[i] = obj
  }
  return tmp
}