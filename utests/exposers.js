const testSTR = "some"
const test1 = (context) => {
    return `${testSTR} | ${context}`
}

expose = {
    test1
}


const e = self.dispatcher()

log(e.test1("help", { a: 1 }))