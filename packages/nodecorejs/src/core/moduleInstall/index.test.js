import { join } from 'path'
import { moduleInstall } from  './index.js'

const fixtures = join(__dirname, 'fixtures')

test('install not existent file', () => {
  expect(
    moduleInstall('../notExistent/exampleFile.7z')
  ).toThrowError()
})