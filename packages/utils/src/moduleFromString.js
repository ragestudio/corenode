export default (src, filename) => {
    var Module = module.constructor
    var m = new Module()

    m._compile(src, filename)
    return m.exports
}