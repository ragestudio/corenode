import isPositiveInteger from './isPositiveInteger'
import lockAsync from './lockAsync'

type Func<Args extends any[], RetVal> = (...args: Args) => Promise<RetVal>

type Resolve<RetVal> = (value?: RetVal | PromiseLike<RetVal> | undefined) => void

export default <R, A extends any[], F extends Func<A, R>>(func: F, numConcurrent = Infinity): F => {
  if (numConcurrent === Infinity) {
    return func
  }

  if (!isPositiveInteger(numConcurrent)) {
    const msg = 'numConcurrent should be a positive integer or Infinity'
    throw new Error(`${msg}. Instead got: ${numConcurrent}`)
  }

  if (numConcurrent === 1) {
    // no need for a queue
    return lockAsync(func)
  }

  const pool = new Set<Promise<R> | Promise<void>>() // pool of promises
  const queue: [A, Resolve<R>][] = [] // queue of args

  function attach(p: Promise<any>) {
    p.then(() => {
      pool.delete(p)
      const o = queue.shift()
      if (!o) {
        return
      }

      const [args, resolve] = o
      const newP = func(...args).then(resolve)
      attach(newP)
      pool.add(newP)
    })
  }

  // @ts-ignore
  return (...args: A) => {
    if (pool.size < numConcurrent) {
      const p = func(...args)
      attach(p)
      pool.add(p)
      return p
    }

    return new Promise<R>(resolve => {
      queue.push([args, resolve])
    })
  }
}
