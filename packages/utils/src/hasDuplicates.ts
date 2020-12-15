/**
 * Checks if an array has duplicate values
 * @return `true` if some values are duplicate, `false` otherwise
 */
export default <T>(arr: readonly T[]) =>
  arr.length !== new Set(arr).size
