export default <T>(arr: readonly T[], begin: number, end: number) =>
  begin < end
    ? arr.slice(begin, end)
    : [...arr.slice(begin), ...arr.slice(0, end)]
