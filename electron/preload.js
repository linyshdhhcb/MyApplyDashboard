import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openSiteWindow: (url) => ipcRenderer.invoke('app:open-site-window', url),
  openExternalBrowser: (url) => ipcRenderer.invoke('app:open-external-browser', url)
})
