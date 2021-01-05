import axios from 'axios'
import { verbosity } from '@nodecorejs/utils'
import { getRuntimeEnv } from '@nodecorejs/dot-runtime'

import uri from './lib/uri'

try {
    if (!global.cloudlink) {
        global.cloudlink = {}
    }

    const fromRuntime = getRuntimeEnv().cloudlink
    if (fromRuntime) {
        global.cloudlink = { ...global.cloudlink, ...fromRuntime }
    }
} catch (error) {
    verbosity.error(error)
}

function register(params) {
    axios(params.origin, { 
        method: "POST",
        data: {
            origin_key: params.origin_key,
            id: params.id,
            policy: params.policy ?? "strict",
            endpoints: params.endpoints
        }
    }).then((res) => {
        console.log(res.data)
    }).catch((err) => {
        console.log(err)
    })
}

function init(params) {
    if (params.origin) {
        global.cloudlink.origin = params.origin
    }
    axios.get(global.cloudlink.origin).then((res) => {
        const ok = res.status === 200
        console.log(res.data)
    })
}

export default {
    uri, init, register
}

