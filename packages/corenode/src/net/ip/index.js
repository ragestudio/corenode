const os = require('os')

function getHostAddress() {
    const interfaces = os.networkInterfaces()

    for (const key in interfaces) {
        const iface = interfaces[key]

        for (let index = 0; index < iface.length; index++) {
            const alias = iface[index]

            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address
            }
        }
    }

    return '0.0.0.0'
}

module.exports = {
    getHostAddress
}