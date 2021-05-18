import { addonInstall } from './index.js'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'

test('install not defined file', () => {
  expect(
    addonInstall(undefined)
  ).rejects.toThrow(`_pathFile is not defined`)
})

test('install not existent file', () => {
  expect(
    addonInstall('../notExistent/exampleFile.7z')
  ).rejects.toThrowError()
})

test('install unpackaged example testing addon', () => {
  const testingAddonPath = path.resolve(process.cwd(), 'testingExampleAddon')
  if (fs.existsSync(testingAddonPath)) {
    rimraf.sync(testingAddonPath)
  }

  let writeData = {
    pkg: "testingAddon"
  }

  fs.mkdirSync(testingAddonPath)
  fs.writeFileSync(`${testingAddonPath}/manifest.json`, JSON.stringify(writeData, null, 2) + '\n', 'utf-8')

  expect(
    addonInstall(testingAddonPath)
  ).resolves.toHaveProperty('pkg')
  
  rimraf.sync(testingAddonPath)
})