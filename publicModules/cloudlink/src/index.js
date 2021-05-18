const http = require('http')

const _wsserver = require('websocket').server
const _wsrouter = require('websocket').router
const _wsframe = require('websocket').frame


function authRequest(origin) {
  return true
}

class Server {
    constructor(params){
        this.opts = {
            port: params?.port ?? 5000
        }

        this.events = 
        this.logs = new Logger()
        this.httpServer = http.createServer((request, response) => {
            this.logs.push(`NEW request [${request.url}]`)

            response.writeHead(404)
            response.end()
        })
        this.wsServer =  new _wsserver({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        })

        // set events
        this.wsServer.on('request', function(request) {
            if (!authRequest(request.origin)) {
              request.reject()
              this.logs.push(`[WS] Connection refused > ${request.origin}`)
              return
            }
            
            const connection = request.accept('echo-protocol', request.origin)
            this.logs.push(`[WS] New connection accepted`)

            connection.on('message', (message) => {
                if (message.type === 'utf8') {
                    this.logs.push(`[WS] Received (utf8) message > ${message.utf8Data}`)
                    connection.sendUTF(message.utf8Data)
                }

                else if (message.type === 'binary') {
                    this.logs.push(`[WS] Received (binary) message > ${message.binaryData.length}bytes`)
                    connection.sendBytes(message.binaryData)
                }
            })

            connection.on('close', (reasonCode, description) => {
                this.logs.push(`[WS] Peer disconnected > ${connection.remoteAddress}`)
            })
        })

        // init
        this.httpServer.listen(this.opts.port, () => {
            
        })
    }
}

module.exports = {
    Server
}