import axios from 'axios'
import { getRuntimeEnv } from '@nodecorejs/dot-runtime'
import { verbosity as veb } from 'nodecorejs/utils'
import { Mutex } from 'async-mutex'

import http from 'http'
import express from 'express'

const verbosity = veb.options({ method: "Cloudlink" })

let app = express()
const httpServer = http.createServer(app)

const clientLock = new Mutex()

try {
    if (!global.cloudlink) {
        global.cloudlink = {
            origin: null,
            nodes: {},
            server: {
                uuid: null
            }
        }
    }

    const fromRuntime = getRuntimeEnv().cloudlink
    if (fromRuntime) {
        global.cloudlink = { ...global.cloudlink, ...fromRuntime }
    }
} catch (error) {
    verbosity.error(error)
}

function createCloudLinkServer(port, endpoints, Controllers = {}, Middlewares = {}) {
    try {
        if (typeof (endpoints) !== "object") {
            verbosity.error("Invalid endpoints")
            return false
        }
        endpoints.forEach((api) => {
            if (typeof (api.path) == "undefined") {
                verbosity.log(`Path is required!`)
                return false
            }
            if (typeof (Controllers[api.controller]) == "undefined") {
                verbosity.log(`Controller (${api.controller}) not loaded!`)
                return false
            }
            let model = [`/${api.path}`]

            let thisController = Controllers[api.controller]
            let thisMiddleware = Middlewares[api.middleware]

            if (typeof (api.exec) !== "undefined") {
                thisController = thisController[api.exec]
            } else {
                thisController = thisController.get
            }

            if (thisController) {
                model.push(thisController)
            }
            if (thisMiddleware) {
                model.push(thisMiddleware)
            }
            app[api.method.toLowerCase() ?? "get"](...model)
        })
    } catch (error) {
        verbosity.error(error)
        return false
    }

    httpServer.listen(port, () => {
        verbosity.log(`CloudLink server ready!`)
    })
}
/**
 * Create an cloudlink-node-server and register to an source cloudlink-server
 * @return this
 */
function register(params) {
    if (typeof(params.originPort) !== "undefined") {
        params.originPort = 6050
    }
    const originAddress = `${params.origin}${params.originPort ? `:${params.originPort}` : ''}`
    const registerTarget = `${params.https ? "https" : "http"}://${originAddress}/register`
    createCloudLinkServer(params.listenPort, params.endpoints, params.controllers)

    axios(registerTarget, {
        method: "POST",
        httpAgent: new http.Agent({ keepAlive: true }),
        headers: {
            "Connection": 'keep-alive',
            "Content-Type": "application/json"
        },
        data: {
            origin_key: params.origin_key,
            id: params.id,
            policy: params.policy ?? "strict",
            endpoints: params.endpoints,
            listenPort: params.listenPort
        }
    })
        .then((res) => {
            if (res.status == 200) {
                verbosity.log(`✅ New register to source [${originAddress}] > UUID [${res.data}]`)
                global.cloudlink.server.uuid = res.data
            }
        })
        .catch((err) => {
            verbosity.error(`[Error ${err.response.status}] ${err.response.data}`)
        })
    return this
}

async function init(params) {
    const instance = await new Promise(async (resolve, reject) => {
        if (params.origin) {
            global.cloudlink.origin = params.origin
        }
        const lock = await clientLock.acquire()
        const res = await axios.get(global.cloudlink.origin)

        global.cloudlink.nodes = res.data
        lock()

        return resolve(this)
    })
    return instance
}

function plug(socket, opt) {
    const protocol = opt?.https ? "https://" : "http://"
    const node = global.cloudlink.nodes[socket]

    if (typeof (node) == "undefined") {
        verbosity.error(`Node not available`)
        return this
    }
    const endpoints = node.endpoints

    let instance = {}

    endpoints.forEach(endpoint => {
        instance[endpoint.path] = async (params) => {
            const request = await axios(`${protocol}${node.remote}:${node.listenPort}/${endpoint.path}`, {
                method: endpoint.method,
                data: params
            })

            return request.data
        }
    })

    return instance
}

export default {
    init, register, plug
}