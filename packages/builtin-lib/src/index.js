export { default as globals } from './globals'
export { default as aliaser } from './aliaser'
export { default as cli } from './cli'

const helpers = process.runtime[0].helpers
const rootRuntime = process.runtime[0]

export {
    helpers,
    rootRuntime
}