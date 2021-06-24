const { performance } = require('perf_hooks')

class Timings {
    constructor(params) {
        this.mutation = Boolean(params.mutation) ?? true
        this.disabled = Boolean(params.disabled) ?? false
        this.decorated = Boolean(params.decorated) ?? false
        this.toFixedValue = params.toFixedValue
        this.id = params.id

        this.timings = {}
    }

    start = (key) => {
        if (!this.disabled) {
            if (!this.mutation && typeof this.timings[key] !== "undefined") {
                return false
            }

            this.timings[key] = performance.now()
        }
    }

    stop = (key) => {
        if (!this.disabled) {
            if (!this.mutation && typeof this.timings[key] !== "undefined") {
                return false
            }

            const res = (performance.now() - this.timings[key]).toFixed(this.toFixedValue ?? 2)
            if (this.decorated) {
                this.timings[key] = `${this.id ? `[${this.id}]` : ""} [${key}]: ${res}ms`
            } else {
                this.timings[key] = res
            }
        }
    }

    get = (key) => {
        if (typeof key !== "undefined") {
            return this.timings[key]
        }

        return this.timings
    }
}

module.exports = {
    Timings
}