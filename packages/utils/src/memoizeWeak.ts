/**
 * Memoizes function with object as the parameter.
 * When the object is garbage-collected, it's removed from the function's cache.
 * @return Memoized function
 * @example
 * const multBy3 = (a) => a * 3
 * const memoizedMultBy3 = memoizeWeak(multBy3)
 * // compute it
 * const a = memoizedMultBy3(5)
 * // not recomputed, instead taken from the function's cache
 * const b = memoizedMultBy3(5)
 */
export default <A extends object, R, F extends (arg: A) => R>(func: F): F => {
  const cache = new WeakMap<A, R>()
  return (arg => {
    if (cache.has(arg)) {
      return cache.get(arg)!
    }
    const result = func(arg)
    cache.set(arg, result)
    return result
  }) as F
}
