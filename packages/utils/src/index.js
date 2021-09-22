/**
 * corenode utility library
 * @module @corenode/utils
 */


/**
* Read all directories from root path
* @param {string} [dir = ""]
* @param {object} [params = undefined]
* @param {object} [params.cwd = process.cwd]
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
export { default as objectToArray } from './objectToArray'

/**
 * @function objectToArrayMap
 */
export { default as objectToArrayMap } from './objectToArrayMap'

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

/**
 * Stringify an parsed version to string with an schema
 * @function versionToString 
 * @param {object} obj
 * @param {object} schema
 * @returns {string}
 */
export { schemizedStringify } from './schemized'

/**
 * Parse an string to object with an schema
 * @function versionToString 
 * @param {object} str
 * @param {object} schema
 * @returns {string}
 */
export { schemizedParse } from './schemized'

/**
 * @function doArray 
 */
export { default as doArray } from './doArray'

/**
 * @function doWithMap 
 */
export { default as doWithMap } from './doWithMap'

/**
 * @function createHttpGetStream 
 */
export { default as createHttpGetStream } from './createHttpGetStream'

/**
 * @function listAllFiles 
 */
export { default as listAllFiles } from './listAllFiles'

/**
 * @function safeStringify 
 */
export { default as safeStringify } from './safeStringify'

/**
 * @function githubReleaseUrl 
 */
export { default as githubReleaseUrl } from './githubReleaseUrl'

/**
 * @function readDirs 
 */
export { default as readDirs } from './readDirs'

/**
 * @function dargs 
 */
export { default as dargs } from './dargs'

/**
 * @function virtualModule 
 */
export { default as virtualModule } from './virtualModule'

/**
 * @function camalize 
 */
export { default as camalize } from './camalize'

/**
 * @function prettyTable 
 */
export { default as prettyTable } from './prettyTable'

/**
 * @function pLimit
 * @copyright Sindre Sorhus
 */
export { default as pLimit } from './pLimit' // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

/**
 * @function pLocate
 * @copyright Sindre Sorhus
 */
export { default as pLocate } from './pLocate' // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

/**
 * @function yoctoQueue
 * @copyright Sindre Sorhus
 */
export { default as yoctoQueue } from './yoctoQueue' // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

/**
 * @function overrideObjects
 */
export { default as overrideObjects } from './overrideObjects'

/**
 * @function overrideObjects
 */
export { default as classAggregation } from './classAggregation'

/**
 * @function htmlEscape
 * @copyright Sindre Sorhus
 */
export * as htmlEscape from './htmlEscape'