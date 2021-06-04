export class Jail {
    constructor(context) {
        this.data = {...context}
        this.global = {}
    }

    get(key) {
        if (typeof key === 'string') {
            return this.data[key]
        }
        return this.global
    }

    set(key, value, options) {
        let properties = {
            writable: options?.writable ?? true,
            configurable: options?.configurable ?? true,
            enumerable: options?.enumerable ?? true,
            value: value
        }

        if (options?.proto)
            properties.__proto__ = options.proto

        if (options?.global)
            Object.defineProperty(this.global, key, properties)
        
        Object.defineProperty(this.data, key, properties)
        return this.data[key]
    }

    del(key) {
        delete this.data[key]
    }
}

export default Jail