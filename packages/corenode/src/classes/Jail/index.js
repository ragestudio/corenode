export class Jail {
    constructor(data) {
        this.data = {...data} ?? {}
    }

    get(key) {
        if (typeof key === 'string') {
            return this.data[key]
        }
        return this.data
    }

    set(key, value, options) {
        let properties = {
            configurable: options?.configurable ?? false,
            enumerable: options?.enumerable ?? true,
            value: value
        }

        if (options?._proto_)
            properties.__proto__ = options.__proto__

        if (options?.writable)
            properties.writable = options.writable

        Object.defineProperty(this.data, key, properties)
        return this.data[key]
    }

    del(key) {
        delete this.data[key]
    }
}

export default Jail