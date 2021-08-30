const WebSocketServer = require('websocket').server
const http = require('http')

class WSServer {
    constructor(params) {
        this.params = { ...params }

        this.port = this.params.port ?? 1015
        this.httpServer = this.params.httpServer ?? http.createServer((request, response) => {
            response.writeHead(404)
            response.end()
        })
        this.wsServer = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: this.params.autoAccept ?? false
        })

        // handlers
        this.onMessage = this.params.onMessage
        this.onClose = this.params.onClose
        this.authorizeOrigin = this.params.authorizeOrigin

        return this
    }

    isOriginAllowed = async (origin) => {
        if (typeof this.authorizeOrigin === "function") {
            const allowed = await this.authorizeOrigin(origin)
            return allowed
        } else {
            // by default
            return true
        }
    }

    init = () => {
        this.httpServer.listen(this.port, () => {
            console.log(`🌐 [WSServer] Listening on port ${this.port}`)
        })

        this.wsServer.on('request', async (request) => {
            const isAlowed = await this.isOriginAllowed(request.origin)

            if (!isAlowed) {
                // Make sure we only accept requests from an allowed origin
                request.reject()
                console.log(`❌ [WSServer] Connection rejected > ${request.origin}`)

                return
            }

            console.log(`✅ [WSServer] Connection accepted > ${request.origin}`)

            const connection = request.accept('echo-protocol', request.origin)

            // set builtIn handlers
            if (typeof this.onClose === 'function') {
                connection.on('message', (...context) => this.onMessage(connection, ...context))
            }
            if (typeof this.onClose === 'function') {
                connection.on('close', (...context) => this.onClose(connection, ...context))
            }
        })
    }
}

function createInstance(context) {
    const instance = new WSServer({ ...context })
    instance.init()
    return instance
}

module.exports = { WSServer, createInstance }