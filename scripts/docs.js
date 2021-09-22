#!/usr/bin/env node
const esdoc = require("esdoc").default

const config = {
    source: "./src",
    destination: "./docs",
    plugins: [
        {
            name: "esdoc-standard-plugin"
        },
        {
            name: "esdoc-ecmascript-proposal-plugin",
            option: {
                all: true,
            }
        },
    ]
}

esdoc.generate(config)