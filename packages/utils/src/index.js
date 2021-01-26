/**
 * Nodecorejs utility library
 * @module @nodecorejs/utils
 */

/**
* Read all directories from root path
* @param {string} [dir = ""]
* @param {object} [params = undefined]
* @param {object} [params.cwd = proccess.cwd]
* @param {object} [params.dotFilter = true]
* @function readRootDirectorySync
*/
export { default as readRootDirectorySync } from './readRootDirectorySync'

/**
* Promisified `setTimeout`
* @param ms Milliseconds timeout
* @function delay
*/
export { default as delay } from './delay'

/**
* @function getObjectPaths
*/
export { default as getObjectPaths } from './getObjectPaths'

/**
 * Checks if an array has duplicate values
 * @function hasDuplicates
 * @return `true` if some values are duplicate, `false` otherwise
 */
export { default as hasDuplicates } from './hasDuplicates'

/**
 * @function isNaturalNumber
 */
export { default as isNaturalNumber } from './isNaturalNumber'

/**
 * Checks if a value is a non-negative integer,
 * i.e. is a whole number greater than or equal to zero
 * @function isNonNegativeInteger
 */
export { default as isNonNegativeInteger } from './isNonNegativeInteger'

/**
 * Checks if a value is a positive integer,
 * i.e. is a whole number greater than zero
 * @function isPositiveInteger
 */
export { default as isPositiveInteger } from './isPositiveInteger'

/**
 * Restricts the function to run only `numConcurrent` instances at the same time
 * @function limitConcurrent
 */
export { default as limitConcurrent } from './limitConcurrent'

/**
 * Restricts the function to run only one instance at the same time
 * @function lockAsync
 */
export { default as lockAsync } from './lockAsync'

/**
 * Memoizes function with object as the parameter.
 * When the object is garbage-collected, it's removed from the function's cache.
 * @function memoizeWeak
 * @return Memoized function
 * @example
 * const multBy3 = (a) => a * 3
 * const memoizedMultBy3 = memoizeWeak(multBy3)
 * // compute it
 * const a = memoizedMultBy3(5)
 * // not recomputed, instead taken from the function's cache
 * const b = memoizedMultBy3(5)
 */
export { default as memoizeWeak } from './memoizeWeak'

/**
 * @function randomColor
 */
export { default as randomColor } from './randomColor'

/**
 * @function chalkRandomColor
 */
export { default as chalkRandomColor } from './chalkRandomColor'

/**
 * Takes all values matching non-negative integer keys in an object
 * and puts them in an array
 * @function objectToArray
 */
export { objectToArray } from './objectToArray'

/**
 * @function objectToArrayMap
 */
export { objectToArrayMap } from './objectToArray'

/**
 * @function verbosity
 */
export { default as verbosity } from './verbosity'

/**
 * Makes an object callable,
 * i.e. converts it to a function, so one can use
 * round braces instead of square brackets
 * @function objectToFunction
 */
export { default as objectToFunction } from './objectToFunction'

/**
 * @function objectToFunctionWithBind
 */
export { default as objectToFunctionWithBind } from './objectToFunctionWithBind'

/**
 * Converts an object to a `Map`
 * @function objectToMap
 */
export { default as objectToMap } from './objectToMap'

/**
 * @function ordinal
 */
export { default as ordinal } from './ordinal'

/**
 * @function queryObjectToString
 */
export { default as queryObjectToString } from './queryObjectToString'

/**
 * Race promises and get the winner's index
 * @function racePromises
 */
export { default as racePromises } from './racePromises'

/**
 * Race promises and get the winner's index ordered by their finishing position
 * @function racePromisesWithPositions
 */
export { default as racePromisesWithPositions } from './racePromisesWithPositions'

/**
 * Generates an alphanumeric random id
 * @function randomId
 */
export { default as randomId } from './randomId'

/**
 * @function sliceRotate
 */
export { default as sliceRotate } from './sliceRotate'

/**
 * Rounds `num` to the nearest number by `step`
 * @function toNearestByStep
 */
export { default as toNearestByStep } from './toNearestByStep'

/**
 * @function decycle
 */
export { default as decycle } from './decycle'

/**
 * @function mergeConfig
 */
export { default as mergeConfig } from './mergeConfig'

/**
 * @function getCircularReplacer
 */
export { default as getCircularReplacer } from './getCircularReplacer'

/**
 * @function requireQueryFilter
 */
export { default as requireQueryFilter } from './filterSchematizedArray'