// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mainAPI', {
  createSearchWindow: () => ipcRenderer.send('createSearchWindow'),
  createConfigWindow: () => ipcRenderer.send('createConfigWindow'),
  closeMainWindow: () => ipcRenderer.send('closeMainWindow'),
  closeConfigWindow: () => ipcRenderer.send('closeConfigWindow'),
  closeSearchWindow: () => ipcRenderer.send('closeSearchWindow'),
  resizeWindow: () => ipcRenderer.send('resizeWindow'),
  createSettingsWindow: () => ipcRenderer.send('createSettingsWindow'),
  closeSettingsWindow: () => ipcRenderer.send('closeSettingsWindow'),
});


contextBridge.exposeInMainWorld('settingsAPI', {
  requestVariable: () => {
    return ipcRenderer.invoke('requestVariable');
  },
})