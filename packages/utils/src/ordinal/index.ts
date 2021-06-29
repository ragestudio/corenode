import isPositiveInteger from '../isPositiveInteger'

const got = (i: any) =>
  typeof i === 'string' ? JSON.stringify(i) : i

function getOrdinalSuffix(i: number) {
  const j = i % 10
  const k = (i % 100) - j
  if (k !== 10) {
    if (j === 1) {
      return 'st'
    }
    if (j === 2) {
      return 'nd'
    }
    if (j === 3) {
      return 'rd'
    }
  }
  return 'th'
}

export default (i: number) => {
  if (!isPositiveInteger(i)) {
    throw new Error(`Number must be a positive integer. Instead got: ${got(i)}`)
  }

  return `${i}${getOrdinalSuffix(i)}`
}
