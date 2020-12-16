/**
 * Checks if a value is a non-negative integer,
 * i.e. is a whole number greater than or equal to zero
 */
export default (num: any): num is number =>
  Number.isInteger(num) && num >= 0
