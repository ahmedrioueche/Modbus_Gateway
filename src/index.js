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

/*--------------Window factory------------------*/
let configWindow, factoryResetWindow, diagnosticsWindow, packetWindow, settingsWindow, helpWindow;
ipcMain.on("openWindow", (event, windowIndex, param) => {
  console.log("open the fucking window");
  console.log("windowIndex", windowIndex);
  console.log("param", param);

  let file;
  switch(windowIndex){
    case 1:
      if(param)
        file = 'views/config/admin-config.html';
      else
        file = 'views/config/general-config.html'

      configWindow = createWindow(configWindow, mainWidth, mainHeight, file, false, false);
      break;

    case 2:
      file = 'views/config/factory-reset.html';
      factoryResetWindow = createWindow(factoryResetWindow, 500, 200, file, false, false);
    break;

    case 3:
      file = 'views/diagnos/diagnostics.html';
      diagnosticsWindow = createWindow(diagnosticsWindow, mainWidth, mainHeight, file, false, false);
    break;

    case 4:
      file = 'views/diagnos/packetDetails.html';
      packetWindow = createWindow(packetWindow, 500, 650, file, false, false);
    break;

    case 5:
      file = 'views/main/settings.html';
      settingsWindow = createWindow(settingsWindow, 450, 650, file, false, false);
    break;

    case 6:
    break;
  }
})

ipcMain.on("closeWindow", (event, windowIndex, param) => {
  console.log("close the fucking window");
  console.log("windowIndex", windowIndex);
  console.log("param", param);

  switch(windowIndex){
    case 0:
      app.quit();
      break;
    case 1:
      closeWindow(configWindow)
      break;

    case 2:
      closeWindow(factoryResetWindow);
    break;

    case 3:
      closeWindow(diagnosticsWindow);
    break;

    case 4:
      closeWindow(packetWindow);
    break;

    case 5:
      closeWindow(settingsWindow);
    break;

    case 6:
    break;
  }
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

    //window.webContents.openDevTools();

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

/*----------------------------User Data------------------------------*/
ipcMain.handle("getUserData", (event, loggedinUsername) => {
  return user.loadUserData(loggedinUsername);
});

let userData;
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
      await user.createDefaultUserData(); 
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
