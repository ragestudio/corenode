const { Jail } = require("@@classes")

class Thing {
    constructor(params) {
        this.params = params

        this.jail = new Jail()
        return this
    }

    connect() {
        //* connect to global controller
    }

    eject() {
        //* disconnect from global controller
    }

}


module.exports = {
    Thing
}