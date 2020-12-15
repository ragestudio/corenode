/**
 * Converts an object to a `Map`
 */
export default <T extends {}, K extends keyof T>(o: T) =>
  new Map<string, T[K]>(Object.entries(o))
