export class Serializer {
    deserialize(input) {
        const datatype = typeof input

        switch (datatype) {
            case "object": {
                let tmp = {}

                const objectKeys = Object.keys(input)

                objectKeys.forEach((key) => {
                    tmp[key] = this.deserialize(input[key])
                })

                input = tmp
                break
            }
            case "function": {
                input = new Function(input)
                break
            }
            default:
                break
        }

        if (Object.keys(input).length <= 0) {
            return false
        }

        return input
    }

    serialize(input) {
        const datatype = typeof input

        switch (datatype) {
            case "object": {
                let tmp = {}

                const objectKeys = Object.keys(input)

                objectKeys.forEach((key) => {
                    tmp[key] = this.serialize(input[key])
                })

                input = tmp
                break
            }
            case "function": {
                input = input.toString()
                break
            }
            default:
                break
        }

        return input
    }
}