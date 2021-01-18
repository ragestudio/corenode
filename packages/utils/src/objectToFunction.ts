export default <T extends {}>(o: T) =>
  <K extends keyof T>(key: K) => o[key]
