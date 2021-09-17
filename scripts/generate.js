/* eslint-disable no-console */
const { writeFile } = require("mz/fs")
const run = require("./lib/run")
const generateReadWordTree = require("./lib/generateReadWordTree")
const generateTokenTypes = require("./lib/generateTokenTypes")

/**
 * Use code generation.
 */
async function generate() {
  await writeFile("./src/parser/tokenizer/types.ts", generateTokenTypes())
  await run("./node_modules/.bin/prettier --write ./src/parser/tokenizer/types.ts")
  await writeFile("./src/parser/tokenizer/readWordTree.ts", generateReadWordTree())
  await run("./node_modules/.bin/prettier --write ./src/parser/tokenizer/readWordTree.ts")
  await run("./node_modules/.bin/ts-interface-builder src/Options.ts --suffix -gen-types")
  await run("./node_modules/.bin/prettier --write ./src/Options-gen-types.ts")
  console.log("Done with code generation.")
}

generate().catch((e) => {
  console.error("Error during code generation!")
  console.error(e)
  process.exitCode = 1
})