import { performance } from 'perf_hooks'

export let performances = []

export function start(name) {
    performances[name] = performance.now()
}

export function stop(name, fix) {
    return (performance.now() - performances[name]).toFixed(fix ?? 2)
}

export default performances