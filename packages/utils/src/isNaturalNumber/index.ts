import isPositiveInteger from '../isPositiveInteger'

type FuncType = typeof isPositiveInteger

/**
 * @deprecated use isPositiveInteger
 */
export default (...args: Parameters<FuncType>): ReturnType<FuncType> => {
  console.warn('isNaturalNumber is deprecated. Use isPositiveInteger instead.')
  return isPositiveInteger(...args)
}
