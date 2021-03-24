const { app, BrowserWindow, ipcMain } = require("electron")
const is = require("electron-is")
const log = require("electron-log")
const { format } = require("url")
const path = require("path")
const waitOn = require("wait-on")

let windowCount = 0
const devURL = 'http://localhost:8000/'

function createWindow(opts) {
  windowCount += 1

  let win = new BrowserWindow(opts)
  win.on('close', () => {
    windowCount -= 1
    win = null
  })

  return win
}

function initMainWindow() {
  const win = createWindow({ width: 800, height: 800, webPreferences: { nodeIntegration: true } })

  if (is.dev()) {
    win.webContents.openDevTools()

    waitOn({ resources: [devURL] }, function (err) {
      if (err) {
        return log.log(err)
      }
      win.loadURL(devURL)
    })
  } else {
    win.loadURL(format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    }))
  }

  return win
}

app.on('ready', () => {
  log.info('(main/index) app ready')
  initMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (window.getCount() === 0) {
    initMainWindow()
  }
})

app.on('quit', () => {
  log.info('(main/index) app quit')
})