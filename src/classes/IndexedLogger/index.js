export default class IndexedLogger {
    constructor() {
        this.options = {
            display: true,
        }
        this.data = []
        this.address = {}
    }

    push(message, key) {
        const date = new Date()

        let obj = date + message

        this.data.push(obj)
        
        if (key) {
            this.address[this.data.lastIndex] = key
        }

        if (this.options.display) {
            console.log(obj)
        }
    }

    get(key) {
        if (typeof key !== "undefined") {
            return this.data[this.address[key]]            
        } else {
            return this.data
        }
    }

    remove(key) {
        delete this.data[this.address[key]]
    }

    disableDisplay = () => this.options.display = false
    enableDisplay = () => this.options.display = true
}