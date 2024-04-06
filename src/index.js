const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { getConfigData, usbSendStartSignal, usbSendStopSignal } = require('./serial.js');
const { usb } = require('usb');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { EventEmitter } = require('stream');
const { connect } = require("amqplib");
let channel = null;
const queue = "messages";
setupRabbitMQ();
async function setupRabbitMQ() {
  const connection = await connect("amqp://localhost");
  channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: false });
}

if (require('electron-squirrel-startup')) {
  app.quit();
}
let isPasswordSet = true;

let mainWidth = 800;
let mainHeight = 900;
/*---------------main window------------------*/
let mainWindow; let startPage;
const createMainWindow = () => {
  if (isPasswordSet)
    startPage = 'index.html';
  else
    startPage = path.join(__dirname, 'src', 'pages', 'main', 'main.html');
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
module.exports.closeMainWindow = closeMainWindow;


/*---------------search window------------------*/
let searchWindow;
let sideWidth = 450;
let sideHeight = 285
function createSearchWindow() {
  searchWindow = createWindow(searchWindow, sideWidth, sideHeight, 'pages/main/search.html', false, false)
}

function resizeSearchWindow() {
  resizeWindow(searchWindow);
}

function closeSearchWindow() {
  closeWindow(searchWindow);
}

ipcMain.on('createSearchWindow', () => {
  createSearchWindow();
});
ipcMain.on('closeSearchWindow', () => {
  closeSearchWindow();
});
ipcMain.on('resizeWindow', () => {
  resizeSearchWindow();
});
module.exports.createSearchWindow = createSearchWindow;
module.exports.closeSearchWindow = closeSearchWindow;


/*---------------configuration window------------------*/
let configWindow;
function createConfigWindow() {
  configWindow = createWindow(configWindow, mainWidth, mainHeight, 'pages/config/general-config.html', false, false)
  
}

function closeConfigWindow() {
  closeWindow(configWindow);
}

ipcMain.on('createConfigWindow', () => {
  createConfigWindow();
});

ipcMain.on('closeConfigWindow', () => {
  closeConfigWindow();
});

module.exports.createConfigWindow = createConfigWindow;
module.exports.closeConfigWindow = closeConfigWindow;


/*--------------settings window---------------------- */
let settingsWindow;
function createSettingsWindow() {
  settingsWindow = createWindow(settingsWindow, sideWidth, sideHeight + 200, 'pages/main/settings.html', false, false)
}

function closeSettingsWindow() {
  closeWindow(settingsWindow);
}

ipcMain.on('createSettingsWindow', () => {
  createSettingsWindow();
});
ipcMain.on('closeSettingsWindow', () => {
  closeSettingsWindow();
});
module.exports.createSettingsWindow = createSettingsWindow;
module.exports.closeSettingsWindow = closeSettingsWindow;

/*----------------Diagnostics window----------------------*/
let diagnosticsWindow;
function createDiagnosticsWindow() {
  diagnosticsWindow = createWindow(diagnosticsWindow, mainWidth, mainHeight, 'pages/main/diagnostics.html', false, true)
}

function closeDiagnosticsWindow() {
  closeWindow(diagnosticsWindow);
}

ipcMain.on('createDiagnosticsWindow', () => {
  createDiagnosticsWindow();
});
ipcMain.on('closeDiagnosticsWindow', () => {
  closeDiagnosticsWindow();
});
module.exports.createDiagnosticsWindow = createDiagnosticsWindow;
module.exports.closeDiagnosticsWindow = closeDiagnosticsWindow;


/*----------------Packet details window----------------------*/
let packetDetailsWindow;
function createPacketDetailsWindow() {
  packetDetailsWindow = createWindow(packetDetailsWindow, 500, 400, 'pages/main/packetDetails.html', false, true)
}

function closePacketDetailsWindow() {
  closeWindow(packetDetailsWindow);
}
ipcMain.on('createPacketDetailsWindow', () => {
  createPacketDetailsWindow();
});

ipcMain.on('closePacketDetailsWindow', () => {
  closePacketDetailsWindow();
});
module.exports.createPacketDetailsWindow = createPacketDetailsWindow;
module.exports.closePacketDetailsWindow = closePacketDetailsWindow;

/*-------------------------------------------------------*/
function createWindow(window, width, height, htmlFile, resizable, allowDuplicates) {
  if ((!window || window.isDestroyed()) || allowDuplicates ) {
    window = new BrowserWindow({
      width: width,
      height: height,
      resizable: resizable,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
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
  if (window) {
    window.close();
    window = null;
  }
}

function resizeWindow(window) {
  window.setSize(sideWidth, window.getBounds().height - 25, true);
}
/*-------------------------------------------------------------------*/

ipcMain.on('getConfigData', (event, configBuffer) => {
  getConfigData(configBuffer);
});


usb.on('attach', function(device) {
  //send a signal to main to display the device
  mainWindow.webContents.send('usbDeviceAttached', device);
});

usb.on('detach', function(device) {
  //send a signal to main to remove the device
  mainWindow.webContents.send('usbDeviceDetached', device);
});

ipcMain.handle("getConnectedDevices", () => {return usb.getDeviceList()});

let openedDevice;
ipcMain.on("saveOpenedDevice", (event, device) => {
  openedDevice = device;
})

ipcMain.handle("getOpenDevice", () => { return openedDevice });

module.exports.openedDevice = openedDevice;

/*-------------------------------------*/
let packetData;
ipcMain.on("savePacketData", (event, packet) => {
  packetData = packet;
})

ipcMain.handle("getOpenedPacketData", ()=> {return packetData})


ipcMain.on("sendStartSignal", (event, device)=> {
  usbSendStartSignal(device);
})

ipcMain.on("sendStopSignal", (event, device)=> {
  usbSendStopSignal(device);
})


channel.consume(queue, (packetBuffer)=> {
  console.log("packetBuffer in index.js", packetBuffer);
  diagnosticsWindow.webContents.send("getPacketData", packetBuffer);
})


let dialogOpened = false; 
ipcMain.on("sendPacketsToSave", (event, packets)=>{
  if(packets.length == 0 || dialogOpened){
    return;
  }
  dialogOpened = true;
  const currentDateTime = new Date();
  const formattedDateTime = currentDateTime.toISOString().replace(/[-T:]/g, '-').split('.')[0]; // Format: YYYYMMDDHHmmSS
  const saveDialog = dialog.showSaveDialog({
    title: 'Save Packets',
    defaultPath: `packets_${formattedDateTime}`, 
    filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'Excel Files', extensions: ['xlsx'] }
    ],
    properties: ['createDirectory']
  });

  // Focus on the dialog window
  if (saveDialog && saveDialog.browserWindow) {
      saveDialog.browserWindow.focus();
  }
  
  saveDialog.then(result => {
      dialogOpened = false;
      if (!result.canceled) {
          const filePath = result.filePath;
          const fileExtension = result.filePath.split('.').pop().toLowerCase();
          
          // Check the file extension to determine the file format
          if (fileExtension === 'json') {
              // Save packets as JSON
              writePacketsToJson(packets, filePath)
                  .then(() => {
                      console.log('Packets saved as JSON:', filePath);
                      event.sender.send('save-packets-success');
                  })
                  .catch(err => {
                      console.error('Error saving packets as JSON:', err);
                      event.sender.send('save-packets-error', err.message);
                  });
          } else if (fileExtension === 'xlsx') {
              // Save packets as Excel
              writePacketsToExcel(packets, filePath)
                  .then(() => {
                      console.log('Packets saved as Excel:', filePath);
                      event.sender.send('save-packets-success');
                  })
                  .catch(err => {
                      console.error('Error saving packets as Excel:', err);
                      event.sender.send('save-packets-error', err.message);
                  });
          } else {
              console.error('Unsupported file format:', fileExtension);
              event.sender.send('save-packets-error', 'Unsupported file format');
          }
      }
  }).catch(err => {
      console.error('Error showing save dialog:', err);
      event.sender.send('save-packets-error', err.message);
  });
  
});


async function writePacketsToJson(packets, filePath) {
    await fs.promises.writeFile(filePath, JSON.stringify(packets, null, 2));
}

async function writePacketsToExcel(packets, filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Packets');

    // Add headers
    worksheet.addRow(['Number', 'Time', 'Source', 'Destination', 'Length', 'Info']);

    // Add packet data
    packets.forEach(packet => {
        worksheet.addRow([
            packet.number,
            packet.time,
            packet.source,
            packet.destination,
            packet.length,
            packet.info
        ]);
    });

    await workbook.xlsx.writeFile(filePath);
}