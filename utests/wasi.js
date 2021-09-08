const fs = require("fs")
const path = require("path")
const md5 = require("md5")
const emsdk = require('emscripten-sdk-npm')
class CacheObject {
  constructor(key, content) {
    this.root = path.join(process.cwd(), ".cn_interpreter")
    this.output = path.join(this.root, key)

    if (!fs.existsSync(this.root)) {
      fs.mkdirSync(this.root)
    }

    return this
  }

  createWriteStream = () => {
    return fs.createWriteStream(this.output)
  }

  createReadStream = () => {
    return fs.createReadStream(this.output)
  }

  write = (content) => {
    fs.writeFileSync(this.output, content, { encoding: "utf-8" })
    return this
  }
}

async function CPPCompile(code, ext = "cpp") {
  const checksum = md5(code)
  const cacheKey = `${checksum}.${ext}`

  const inputFile = new CacheObject(cacheKey)
  inputFile.write(code)

  const outputFile = new CacheObject(`out_${checksum}.wasm`)

  await emsdk.run(
    'emcc',
    [
      "-O0", inputFile.output, '-o', outputFile.output,  "-s", "WASM=1", 
    ],
  )

  return fs.readFileSync(outputFile.output)
}

async function _main() {
  const file = await CPPCompile(`
int add(int a, int b) {
    return a + b;
}
  `,)

  WebAssembly.instantiate(new Uint8Array(file), {})
    .then(result => {
      console.log(util.inspect(result, true, 0));
      console.log(result.instance.exports._add(10, 9));
    })
    .catch(e => console.log(e));

}


_main()