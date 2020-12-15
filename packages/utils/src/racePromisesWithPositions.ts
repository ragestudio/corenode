import castArray from 'lodash/castArray'

import isPositiveInteger from './isPositiveInteger'
import racePromises from './racePromises'

/**
 * Race promises and get the winner's index ordered by their finishing position
 */
export default <T>(promises: readonly Promise<T>[], limit = Infinity) => {
  const len = promises.length

  if (limit > len) {
    limit = len
  }

  if (!isPositiveInteger(limit) && limit !== Infinity) {
    throw new Error(`limit should be a positive integer or Infinity. Instead got: ${limit}`)
  }

  if (limit === 1) {
    return racePromises(promises).then(castArray)
  }

  return new Promise<number[]>((resolve, reject) => {
    const positions: number[] = []
    for (let i = 0; i < len; ++i) {
      promises[i]
        .then(() => {
          positions.push(i)
          if (positions.length === limit) {
            resolve(positions.slice())
          }
        })
        .catch(reject)
    }
  })
}
