const { verbosity } = require('@corenode/utils')
const express = require('express')
const next = require('next')

const moduleEnv = _env.nextModule 

const port = moduleEnv?.port ?? 8050;
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

async function initApp() {
    await app.prepare()
    const server = express()

    server.get(/\.css$/, (req, res, nextHandler) => {
        res.setHeader(
            "Cache-Control",
            "public, max-age=0, immutable",
        );
        nextHandler()
    })

    server.get('*', (req, res) => handle(req, res))

    await server.listen(port)
    verbosity.log(`> Ready on http://localhost:${port}`)
}

expose = { 
    initApp
}