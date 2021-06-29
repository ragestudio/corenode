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
