type Func<A extends any[], R> = (...args: A) => Promise<R>

/**
 * Restricts the function to run only one instance at the same time
 */
export default <R, A extends any[], F extends Func<A, R>>(func: F): F => {
  let prev: Promise<void | R> = Promise.resolve()
  // @ts-ignore
  return (...args: A) => {
    const next = prev.then(() => func(...args))
    prev = next
    return next
  }
}
