const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mainAPI', {

    getUserData: () => 
        ipcRenderer.invoke("getUserData"),

    saveUserData: (userData) => 
        ipcRenderer.send("saveUserData", userData),

    validateUserData: (username, password) => 
        ipcRenderer.invoke("validateUserData", username, password),

    createSearchWindow: () => 
        ipcRenderer.send('createSearchWindow'),

    createConfigWindow: (isAdmin) => 
        ipcRenderer.send('createConfigWindow', isAdmin),
        
    closeMainWindow: () => 
        ipcRenderer.send('closeMainWindow'),

    closeConfigWindow: () => 
        ipcRenderer.send('closeConfigWindow'),

    closeSearchWindow: () => 
        ipcRenderer.send('closeSearchWindow'),

    resizeWindow: () => 
        ipcRenderer.send('resizeWindow'),

    createSettingsWindow: () => 
        ipcRenderer.send('createSettingsWindow'),

    closeSettingsWindow: () => 
        ipcRenderer.send('closeSettingsWindow'),

    createDiagnosticsWindow: () => 
        ipcRenderer.send('createDiagnosticsWindow'),

    closeDiagnosticsWindow: () => 
        ipcRenderer.send('closeDiagnosticsWindow'),

    createPacketDetailsWindow: () => 
        ipcRenderer.send('createPacketDetailsWindow'),

    closePacketDetailsWindow: () => 
        ipcRenderer.send('closePacketDetailsWindow'),

    createConfigDialogWindow: () => 
        ipcRenderer.send('createConfigDialogWindow'),
    
    closeConfigDialogWindow: () => 
        ipcRenderer.send('closeConfigDialogWindow'),

});

contextBridge.exposeInMainWorld('serialAPI', {
    getConfigData: (configBuffer) =>
        ipcRenderer.send('getConfigData', configBuffer),

    usbDeviceAttached: (callback) =>
        ipcRenderer.on('usbDeviceAttached', (event, device) => callback(device)),

    usbDeviceDetached: (callback) =>
        ipcRenderer.on('usbDeviceDetached', (event, device) => callback(device)),

    getConnectedDevices: () => 
        ipcRenderer.invoke('getConnectedDevices'),

    saveOpenedDevice: (selectedDevice) => 
        ipcRenderer.send("saveOpenedDevice", (event, selectedDevice)),

    getOpenedDevice : () => 
        ipcRenderer.invoke("getOpenDevice"),

    savePacketData: (packet) => 
        ipcRenderer.send("savePacketData", (event, packet)),

    getOpenedPacketData: () => 
        ipcRenderer.invoke("getOpenedPacketData"),

    sendStartSignal: (device) => 
        ipcRenderer.send("sendStartSignal", device),
    
    sendStopSignal: (device) => 
        ipcRenderer.send("sendStopSignal", device),

    getPacketData: (callback) =>
        ipcRenderer.on("getPacketData", (event, packet) => callback(packet)),
  
    sendPackets: (packets) => 
        ipcRenderer.send("sendPacketsToSave", packets),
    
    sendAdminConfigData: (configData) => 
        ipcRenderer.send('sendAdminConfigData', configData),

    sendFactoryResetSignal: () => 
        ipcRenderer.send('sendFactoryResetSignal'),

});

contextBridge.exposeInMainWorld('settingsAPI', {
  requestVariable: () => {
    return ipcRenderer.invoke('requestVariable');
  },
})