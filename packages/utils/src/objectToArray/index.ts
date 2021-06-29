import isNonNegativeInteger from '../isNonNegativeInteger'

interface Obj {
  [k: number]: any,
}

/**
 * Takes all values matching non-negative integer keys in an object
 * and puts them in an array
 */
export default function objectToArray<obj extends Readonly<Obj>, V extends obj[keyof obj]>(payload: obj) {
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