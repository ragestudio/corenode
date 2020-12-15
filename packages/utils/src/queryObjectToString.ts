import mapValues from 'lodash/mapValues'
import isNil from 'lodash/isNil'

function getValue<T extends {}>(val: T) {
  if (val instanceof Date) {
    return val.toISOString()
  }

  return String(val)
}

interface O<V> {
  [key: string]: V,
}

/**
 * Converts object to search params string
 */
export default <V>(obj: null | undefined | O<V>) => {
  if (isNil(obj)) {
    return ''
  }

  const transformedObj = mapValues(obj, getValue)
  const params = new URLSearchParams(transformedObj)
  return params.toString()
}
