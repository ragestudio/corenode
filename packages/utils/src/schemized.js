const { objectToArrayMap } = require('./objectToArray')


export function schemizedStringify(obj, schema, join) {
    let version = []
    objectToArrayMap(obj).forEach(element => {
        if (typeof (element.value) !== "undefined" && element.value != null) {
            version[schema[element.key]] = element.value
        }
    })
    return version.join(join)
}

export function schemizedParse(str, schema, splitter) {
    if (!schema) return false

    const parsed = {}

    schema.forEach((key) => {
        parsed[key] = null
    })

    objectToArrayMap(str.split(splitter)).forEach((key) => {
        let value = key.value

        if (isNaN(Number(key.value))) {
            value = key.value
        } else {
            value = Number(key.value)
        }

        if (value != null) {
            parsed[schema[key.key]] = value
        }
    })

    return parsed
}