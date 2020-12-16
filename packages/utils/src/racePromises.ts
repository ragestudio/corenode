/**
 * Race promises and get the winner's index
 */
export default <T>(promises: readonly Promise<T>[]) =>
  new Promise<number>((resolve, reject) => {
    const len = promises.length
    for (let i = 0; i < len; ++i) {
      promises[i]
        .then(() => resolve(i))
        .catch(reject)
    }
  })
