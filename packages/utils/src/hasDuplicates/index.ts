export default <T>(arr: readonly T[]) =>
  arr.length !== new Set(arr).size
