export default (_instanceConstructor, src, filename) => {
    const _Module = _instanceConstructor ?? module.constructor
    const m = new _Module()

    m._compile(src, filename)
    return m.exports
}