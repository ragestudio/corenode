/**
 * Checks if a value is a positive integer,
 * i.e. is a whole number greater than zero
 */
export default (num: any): num is number =>
  Number.isInteger(num) && num > 0
