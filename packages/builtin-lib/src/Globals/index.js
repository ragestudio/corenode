export default class globals {
    constructor(globals) {
        this.Allocations = globals ?? []
        this.init()
    }

    init() {
        if (Array.isArray(this.Allocations)) {
            this.Allocations.forEach((_global) => {
                this.allocate(_global)
            })
        }
    }

    allocate(name, payload) {
        if (global[name] != null) {
            return true
        }
        return global[name] = payload ?? {}
    }
}