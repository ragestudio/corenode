import { moduleInstall } from './index.js'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'

test('install not defined file', () => {
  expect(
    moduleInstall(undefined)
  ).rejects.toThrow(`_pathFile is not defined`)
})

test('install not existent file', () => {
  expect(
    moduleInstall('../notExistent/exampleFile.7z')
  ).rejects.toThrowError()
})

test('install unpackaged example testing module', () => {
  const testingModulePath = path.resolve(process.cwd(), 'testingExampleModule')
  if (fs.existsSync(testingModulePath)) {
    rimraf.sync(testingModulePath)
  }

  let writeData = {
    pkg: "testingModule"
  }

  fs.mkdirSync(testingModulePath)
  fs.writeFileSync(`${testingModulePath}/manifest.json`, JSON.stringify(writeData, null, 2) + '\n', 'utf-8')

  expect(
    moduleInstall(testingModulePath)
  ).resolves.toHaveProperty('pkg')
  
  rimraf.sync(testingModulePath)
})