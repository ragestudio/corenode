/**
 * Rounds `num` to the nearest number by `step`
 */
export default (num: number, step: number) =>
  step * Math.round(num / step)
