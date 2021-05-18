export class Logger {
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

        console.log(this.data.lastIndex)
        
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

    remove() {

    }

    disableDisplay = () => this.options.display = false
    enableDisplay = () => this.options.display = true
}

export default Logger