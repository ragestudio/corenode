const assert = require('assert')

class MainFactory {
    constructor() {
        this.factories = {}
    }

    connect = (factory) => {
        if (factory instanceof FactoryController) {
            this.factories[factory.storeID] = factory
        } else {
            throw new Error(`Invalid factory!`)
        }
    }

    dispatch = (key) => {
        return this.factories[key]
    }
}

class FactoryController {
    constructor(mainFactory, key) {
        assert(mainFactory instanceof MainFactory, () => { throw new Error(`Invalid main factory`) })
        this.store = {}

        this.storeID = key
        mainFactory.connect(this)
    }

    set = (thing) => {

    }

    get = (thing) => {
        if (typeof key === "string") {
            return this.store[key]
        }
        return this.store
    }
}

class Thing {
    constructor(params) {
        this.params = params

        return this
    }

    create = (thing, factoryID) => {
        const type = typeof thing === 'object'
    }

    connect = (to) => {

    }

    eject() {

    }
}

module.exports = {
    Thing,
    FactoryController,
    MainFactory
}