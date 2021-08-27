const WebSocketClient = require('websocket').client
const { EventEmitter } = require('events')

class WSClient {
    constructor(params) {
        this.params = { ...params }
        this.client = new WebSocketClient()
        this.events = new EventEmitter()

        this.hostname = this.params.hostname ?? "localhost"
        this.wsProtocol = this.params.wsProtocol ?? "default"
        this.wsPort = this.params.port ?? 1015
        this.wsAddress = `${this.wsProtocol === "secure" ? "wss" : "ws"}://${this.hostname}${this.wsPort ? `:${this.wsPort}` : ""}`

        //? handlers
        this.onMessage = this.params.onMessage
        this.onClose = this.params.onClose
        this.onError = this.params.onError
        this.onConnectFail = this.params.onConnectFail ?? function(err) { 
            throw new Error(`Failed to connect to [${this.hostname}] > ${err}`)
        }
        
        this.client.on('connectFailed', (...context) => this.onConnectFail(...context))
        
        this.client.on('connect', (connection) => {
            console.log(`✅ [WSClient] Connection established`)
            this.connection = connection

            if (typeof this.params.onConnect === 'function') {
                this.params.onConnect(connection)
            }

            this.events.emit('connect')

            if (typeof this.onError === "function") {
                connection.on('error', (...context) => this.onError(connection, ...context))
            }
            if (typeof this.onClose === "function") {
                connection.on('close', (...context) => this.onClose(connection, ...context))
            }
            if (typeof this.onMessage === "function") {
                connection.on('message', (...context) => this.onMessage(connection, ...context))
            }
        })

        return this
    }

    init = (callback) => {
        this.client.connect(this.wsAddress, 'echo-protocol')
        this.events.on('connect', () => {
            if (typeof callback === 'function') {
                return callback()
            }
        })
    }
}

function createInstance(context) {
    const instance = new WSClient({ ...context })
    instance.init()
    return instance
}

module.exports = { WSClient, createInstance }