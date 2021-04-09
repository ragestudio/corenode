const fs = require("fs")
const path = require("path")

const { WASI } = require("wasi")

const wasi = new WASI()
const importObject = { wasi_snapshot_preview1: wasi.wasiImport }

(async () => {
  const wasm = await WebAssembly.compile(fs.readFileSync(path.resolve(process.cwd(), "addons/hello.wasm")))
  const instance = await WebAssembly.instantiate(wasm, importObject)

  wasi.start(instance)
})()