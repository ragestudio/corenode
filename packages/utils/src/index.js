/**
 * corenode utility library
 * @module @corenode/utils
 */

/**
* @function delay
* @description Promisified `setTimeout`
* @param ms Milliseconds timeout
*/
export { default as delay } from './delay'

/**
* @function getObjectPaths
*/
export { default as getObjectPaths } from './getObjectPaths'

/**
 * @function hasDuplicates
 * @description Checks if an array has duplicate values
 * @return `true` if some values are duplicate, `false` otherwise
 */
export { default as hasDuplicates } from './hasDuplicates'

/**
 * @function isNaturalNumber
 */
export { default as isNaturalNumber } from './isNaturalNumber'

/**
 * @function isNonNegativeInteger
 * @description Checks if a value is a non-negative integer,
 * @description i.e. is a whole number greater than or equal to zero
 */
export { default as isNonNegativeInteger } from './isNonNegativeInteger'

/**
 * @function isPositiveInteger
 * @description Checks if a value is a positive integer,
 * @description i.e. is a whole number greater than zero
 */
export { default as isPositiveInteger } from './isPositiveInteger'

/**
 * @function limitConcurrent
 * @description Restricts the function to run only `numConcurrent` instances at the same time
 */
export { default as limitConcurrent } from './limitConcurrent'

/**
 * @function lockAsync
 * @description Restricts the function to run only one instance at the same time
 */
export { default as lockAsync } from './lockAsync'

/**
 * @function memoizeWeak
 * @description Memoizes function with object as the parameter.
 * @description When the object is garbage-collected, it's removed from the function's cache.
 * @return Memoized function
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
 * @function objectToArray
 * @description Takes all values matching non-negative integer keys in an object
 * @description and puts them in an array
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
 * @function objectToFunction
 * @description Makes an object callable,
 * @description i.e. converts it to a function, so one can use
 * @description round braces instead of square brackets
 */
export { default as objectToFunction } from './objectToFunction'

/**
 * @function objectToFunctionWithBind
 */
export { default as objectToFunctionWithBind } from './objectToFunctionWithBind'

/**
 * @function objectToMap
 * @description Converts an object to a `Map`
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
 * @function racePromises
 * @description Race promises and get the winner's index
 */
export { default as racePromises } from './racePromises'

/**
 * @function racePromisesWithPositions
 * @description Race promises and get the winner's index ordered by their finishing position
 */
export { default as racePromisesWithPositions } from './racePromisesWithPositions'

/**
 * @function randomId
 * @description Generates an alphanumeric random id
 */
export { default as randomId } from './randomId'

/**
 * @function sliceRotate
 */
export { default as sliceRotate } from './sliceRotate'

/**
 * @function toNearestByStep
 * @description Rounds `num` to the nearest number by `step`
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
 * @function versionToString 
 * @description Stringify an parsed version to string with an schema
 * @param {object} obj
 * @param {object} schema
 * @return {string}
 */
export { schemizedStringify } from './schemized'

/**
 * @function versionToString 
 * @description Parse an string to object with an schema
 * @param {object} str
 * @param {object} schema
 * @return {string}
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
 * @function safeStringify 
 */
export { default as safeStringify } from './safeStringify'

/**
 * @function githubReleaseUrl 
 */
export { default as githubReleaseUrl } from './githubReleaseUrl'

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
 * @author Sindre Sorhus
 */
export { default as pLimit } from './pLimit' // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

/**
 * @function pLocate
 * @author Sindre Sorhus
 */
export { default as pLocate } from './pLocate' // Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

/**
 * @function yoctoQueue
 * @author Sindre Sorhus
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
 * @author Sindre Sorhus
 */
export * as htmlEscape from './htmlEscape'

/**
 * @module randomWord
 * @function generate
 * @function normalize
 */
export * as randomWord from "./randomWord"