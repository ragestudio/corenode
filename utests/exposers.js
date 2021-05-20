const convert = (name, options) => {
    return `☺🏀 Hello ${name}`
}

expose = {
    convert: convert
}

const _self = self.dispatcher()
const transformedSTR = _self.convert("help")

out(`${transformedSTR}`)
