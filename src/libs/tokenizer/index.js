const { validate, version, v5, v4 } = require('uuid')
const os = require('os')

// Unique session ID
function generateUSID() {
    return v4()
}
// Origin Server Key ID
function generateOSKID(hostname) {
    return v5(hostname ?? os.hostname(), v4())
}

function validateOSKID(uuid) {
    return validate(uuid) && version(uuid) === 5
}

module.exports = { generateUSID, generateOSKID, validateOSKID }