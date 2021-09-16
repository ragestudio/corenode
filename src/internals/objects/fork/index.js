const { EvalMachine } = require("@@vm")

module.exports = function (fn, options, callback) {
    const machine = new EvalMachine()
    machine.do(fn, options, (...context) => {
        if (typeof callback === "function") {
            callback(...context)
        }
        machine.destroy()
    })
}