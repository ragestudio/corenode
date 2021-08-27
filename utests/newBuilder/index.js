const path = require('path')
const { Builder } = require('../../packages/builder/src/index.js')

const exampleBuilder = new Builder({ dir: [ path.join(__dirname, "./src2")], showProgress: true })

async function build() {
    exampleBuilder.buildAllSources().then(() => {
        console.log("Build success")
    })
}

build()