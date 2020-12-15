import stubFalse from 'lodash/stubFalse'
import isObjectLike from 'lodash/isObjectLike'

type Primitive = number | string | boolean | bigint | symbol

type Recursive<T> = T | RecursiveObject<T>

interface RecursiveObject<T> {
  [key: string]: Recursive<T>,
}

type Predicate = (value: Recursive<Primitive>, key: string) => boolean

export default (
  obj: RecursiveObject<Primitive>,
  stopIf: Predicate = stubFalse,
  ignoreIf: Predicate = stubFalse,
) => {
  const getPaths = (o: RecursiveObject<Primitive>): string[][] =>
    Object.keys(o)
      .filter(k => !ignoreIf(o[k], k))
      .flatMap(k => {
        const v = o[k]
        return !isObjectLike(v) || stopIf(v, k)
          ? [[k]]
          : getPaths(v as RecursiveObject<Primitive>).map(newKeys => [k, ...newKeys])
      })

  return getPaths(obj)
}
