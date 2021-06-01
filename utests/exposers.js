const convert = (name, options) => {
    return `👋 Hello ${name ?? "Unnamed"}`
}

expose = {
    convert: convert
}

const _ = self.dispatcher()
const transformedString = _.convert("Kevin")
const transformedString2 = _.convert()

console.log(transformedString)
console.log(transformedString2)
