/**
 * Generates an alphanumeric random id
 */
export default () =>
  Math.random().toString(36).slice(2)
