import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_PARTITION = 'persist:my-apply-dashboard'
const isDev = !app.isPackaged

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1680,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#0b1320',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      partition: APP_PARTITION
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    createSiteWindow(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createSiteWindow(url) {
  const siteWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: APP_PARTITION
    }
  })

  siteWindow.webContents.setWindowOpenHandler(({ url: nextUrl }) => {
    createSiteWindow(nextUrl)
    return { action: 'deny' }
  })

  siteWindow.loadURL(url)
}

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('app:open-site-window', (_, url) => {
  createSiteWindow(url)
})

ipcMain.handle('app:open-external-browser', (_, url) => {
  return shell.openExternal(url)
})
