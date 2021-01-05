import axios from 'axios'

export const uri = {
    compile: async (endpoint, opt_prefix) => {
        return new Promise(async (resolve, reject) => {
            if (!global.cloudlink.origin) {
                return reject(`Origin is missing!`)
            }
            if (!global.cloudlink.endpoints) {
                return reject(`No any endpoints available`)
            }

            const resolvers = await uri.resolveOrigin(global.cloudlink.origin)
            const prefix = resolvers[opt_prefix]

            let final = null
            let url
            let method
            const endpointSplit = endpoint.split(' ')
            if (endpointSplit.length === 2) {
                method = endpointSplit[0]
                url = endpointSplit[1]
                url = prefix + url
                return resolve({ url, method })
            }

            Object.values(global.cloudlink.endpoints).find(item => {
                url = item
                method = 'GET'
                const paramsArray = item.split(' ')
                if (paramsArray.length === 2) {
                    method = paramsArray[0]
                    url = paramsArray[1]
                }
                if (endpoint === url) {
                    url = prefix + url
                    return (final = { url, method })
                }
            })
            return resolve(final)
        })
    },
    resolveOrigin: (address) => {
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: address,
            }).then((res) => {
                return resolve(res.data.response)
            })
        })
    }
}

export default uri