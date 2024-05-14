const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const serial = require('./model/serial.js');
const packetHandler = require('./model/packet.js')
const exporter = require('./model/dataExporter.js')
const user = require('./model/user.js')
const { SerialPort } = require('serialport');
require('dotenv').config();

if (require('electron-squirrel-startup')) {
  app.quit();
}   

let isPasswordSet = false;
let mainWidth = 800;
let mainHeight = 900;
/*---------------main window------------------*/
let mainWindow; let startPage;
const createMainWindow = () => {
  if (isPasswordSet)
    startPage = 'views/auth/login.html';
  else  
    startPage = "views/main/main.html";
    mainWindow = createWindow(mainWindow, mainWidth, mainHeight, startPage, false, false);
};

function closeMainWindow() {
   app.quit();
}

app.on('ready', createMainWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

ipcMain.on('closeMainWindow', () => {
  closeMainWindow();
});

/*---------------search window------------------*/
let searchWindow;
let sideWidth = 450;
let sideHeight = 285

ipcMain.on('createSearchWindow', () => {
  searchWindow = createWindow(searchWindow, sideWidth, sideHeight, 'views/main/search.html', false, false)
});
ipcMain.on('closeSearchWindow', () => {
  closeWindow(searchWindow);
});

/*---------------configuration window------------------*/
let configWindow;
function createConfigWindow(isAdmin) { //is it user config or admin config
  console.log("isAdmin", isAdmin)
  if(isAdmin)
    configWindow = createWindow(configWindow, mainWidth, mainHeight, 'views/config/admin-config.html', false, false)
  else
    configWindow = createWindow(configWindow, mainWidth, mainHeight, 'views/config/general-config.html', false, false)
}

ipcMain.on('createConfigWindow', (event, isAdmin) => {
  createConfigWindow(isAdmin);
});

ipcMain.on('closeConfigWindow', () => {
  closeWindow(configWindow);
});

/*--------------settings window---------------------- */
let settingsWindow;

ipcMain.on('createSettingsWindow', () => {
  settingsWindow = createWindow(settingsWindow, sideWidth, sideHeight + 360, 'views/main/settings.html', false, false)
});
ipcMain.on('closeSettingsWindow', () => {
  closeWindow(settingsWindow);
});

/*----------------Diagnostics window----------------------*/
let diagnosticsWindow;

ipcMain.on('createDiagnosticsWindow', () => {
  diagnosticsWindow = createWindow(diagnosticsWindow, mainWidth, mainHeight, 'views/diagnos/diagnostics.html', false, true)
});

ipcMain.on('closeDiagnosticsWindow', () => {
  closeWindow(diagnosticsWindow);
  if(openedDevice)
    serial.usbStop(openedDevice);
});

/*----------------Packet details window----------------------*/
let packetDetailsWindow;

function closePacketDetailsWindow() {
  closeWindow(packetDetailsWindow);
}
ipcMain.on('createPacketDetailsWindow', () => {
  closePacketDetailsWindow(packetDetailsWindow);
  packetDetailsWindow = createWindow(packetDetailsWindow, 500, 650, 'views/diagnos/packetDetails.html', false, true)
});

ipcMain.on('closePacketDetailsWindow', () => {
  closePacketDetailsWindow();
});

/*-------------------------config dialog window--------------------------------*/
let configDialogWindow;
ipcMain.on("createConfigDialogWindow", () => {
  configDialogWindow = createWindow(configDialogWindow, 500, 200, "views/config/factory-reset.html",false, false);
})

ipcMain.on("closeConfigDialogWindow", () => {
  closeWindow(configDialogWindow);
})

/*----------------------------------------------------------------------------*/
function createWindow(window, width, height, htmlFile, resizable, allowDuplicates) {
  if ((!window || window.isDestroyed()) || allowDuplicates ) {
    window = new BrowserWindow({
      width: width,
      height: height,
      resizable: resizable,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true
      },
      fullscreenable: false,
      fullscreen: false,
      maximizable: false
    });

    window.loadFile(path.join(__dirname, htmlFile));

    window.webContents.openDevTools();

    window.on('will-resize', () => {
      resizeHandler(window, width, height, resizable);
    });

    window.on('closed', () => {
      window = null;
    });

    if (resizable) {
      window.on('willEnterFullScreen', (event) => {
        event.preventDefault();
      });
    }

    Menu.setApplicationMenu(null);
  } else {
    window.focus();
  }

  return window;
}

function resizeHandler(window, winWidth, winHeight, disableResize) {
  const { width } = window.getBounds();
  const { height } = window.getBounds();

  const minWidth = winWidth;
  const minHeight = winHeight;

  if (disableResize) {
    window.setSize(winWidth, winHeight, true);
  }
  else {
    if (width < minWidth) {
      window.setSize(minWidth, window.getBounds().height, true);
    }
    if (height < minHeight) {
      window.setSize(window.getBounds().width, minHeight, true);
    }
  }
}

function closeWindow(window) {
  try {
    if (window) {
      window.close();
      window = null;
    }
  }
  catch (error){
    console.log(error)
  }
  
}

function resizeWindow(window) {
  window.setSize(sideWidth, window.getBounds().height - 25, true);
}

/*----------------------------User Data------------------------------*/
ipcMain.handle("getUserData", (event, loggedinUsername) => {
  return user.loadUserData(loggedinUsername);
});

ipcMain.on("saveUserData", async (event, updatedUserData) => {
  const hashedPassword = await user.hashPassword(updatedUserData.admin.password);
  updatedUserData.admin.password = hashedPassword;
  userData = updatedUserData;
  user.saveUserData(userData);
})

ipcMain.handle("validateUserData", async (event, username, password) => {
  return user.validateUserData(username, password);
})

let userDataFileCreated = false;
app.on('ready', async () => {
  // Create the userData.json file if it hasn't been created yet
  if (!userDataFileCreated) {
      await user.createDefaultUserDataFile(); 
      userDataFileCreated = true; 
  }
});

/*--------------------serial port-------------------------------*/
// Start monitoring for changes in COM ports
serial.checkForPortChanges();

process.on("portChange", changedPorts => {
  if(mainWindow)
    mainWindow.webContents.send("serialPortsUpdate", changedPorts.addedPorts, changedPorts.removedPorts);
})

ipcMain.handle("getConnectedDevices", async () => { 
  return ports = await SerialPort.list(); 
});

let openedDevice;
ipcMain.on("saveOpenedDevice", (event, device) => {
  openedDevice = device;
})

ipcMain.handle("getOpenDevice", () => { return openedDevice });

module.exports.openedDevice = openedDevice;

/*------------------------------------------------------------*/
ipcMain.on('sendConfigData', (event, configBuffer, configDevice) => {
  packetHandler.sendConfigData(configBuffer, configDevice);
});

let packetData;
ipcMain.on("savePacketData", (event, packet) => {
  packetData = packet;
})

ipcMain.handle("getOpenedPacketData", ()=> {return packetData})

ipcMain.on("sendStartSignal", (event, device)=> {
  serial.usbSendStartSignal(device);
})

ipcMain.on("sendStopSignal", (event, device)=> {
  serial.usbSendStopSignal(device);
})

process.on("data", function(packetBuffer) {
  diagnosticsWindow.webContents.send("getPacketData", packetBuffer)
})

if(diagnosticsWindow){
  diagnosticsWindow.on('closed', () => {
    serial.usbSendStopSignal(openedDevice);
  });
}

ipcMain.on("sendAdminConfigData", (event, configData) => {
  serial.usbSendAdminConfigData(openedDevice, configData);
})

ipcMain.on("sendFactoryResetSignal", () => {
  serial.usbSendFactoryResetSignal(openedDevice);
})


/*------------------save window--------------------------*/
ipcMain.on("sendPacketsToSave", (event, packets)=>{
  exporter.exportData(packets);
});
