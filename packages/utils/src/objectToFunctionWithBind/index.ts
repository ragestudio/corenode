export default <T extends {}>(o: T) =>
  <K extends keyof T>(key: K) => {
    const v = o[key]
    return typeof v === 'function'
      ? v.bind(o) as typeof v
      : v
  }
