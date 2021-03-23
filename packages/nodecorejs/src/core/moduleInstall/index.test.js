import { moduleInstall } from  './index.js'

test('install not existent file', () => {
  expect(
    moduleInstall('../notExistent/exampleFile.7z')
  ).rejects.toThrowError()
})