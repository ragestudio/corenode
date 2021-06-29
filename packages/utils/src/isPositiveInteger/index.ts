export default (num: any): num is number =>
  Number.isInteger(num) && num > 0
