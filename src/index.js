const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { getConfigData, usbSendStartSignal, usbSendStopSignal, usbSendAdminConfigData, usbSendFactoryResetSignal, usbStop} = require('./serial.js');
const { usb } = require('usb');
const { serialport } = require('serialport');
const fs = require('fs');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
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
    startPage = 'login.html';
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
    usbStop(openedDevice);
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
let adminDefaultPassword;
let manufacturerDefaultPassword;
let loggedinUsername;
ipcMain.handle("getUserData", (loggedinUsername) => {
  return loadUserData(loggedinUsername);
});

ipcMain.on("saveUserData", async (event, updatedUserData) => {
  const hashedPassword = await hashPassword(updatedUserData.admin.password);
  updatedUserData.admin.password = hashedPassword;
  userData = updatedUserData;
  saveUserData(userData);
});

ipcMain.handle("validateUserData", async (event, username, password) => {
  loggedinUsername = username;
  userData = await loadUserData(username);
  if(userData){
    try {
      if(userData.username !== username)
        return -1;

      const result = await bcrypt.compare(password, userData.password);
      if (!result) {
        console.log("Password is invalid");
        return -2;

      } else {  
          console.log("Password is valid");
          if(username === process.env.manufacturerDefaultUsername)
            return 0xCF;

          return 0;
      }
    } catch (error) {
      console.error("Error comparing passwords:", error);
    }  
  }
  else return -1;
});

async function hashDefaultPass() {
  adminDefaultPassword = await hashPassword("admin");
  manufacturerDefaultPassword = await hashPassword(process.env.manufacturerDefaultPassword);
}

hashDefaultPass().then(() => {
}).catch(error => {
  console.error("Error hashing password:", error);
});

async function loadUserData(username) {
  try {
    const data = fs.readFileSync('userData.json');
    const userData = JSON.parse(data);
    console.log("username", username)
    console.log("manifacturerDefaultUsername", process.env.manufacturerDefaultUsername)
    if (username === process.env.manufacturerDefaultUsername) {
      return userData.manufacturer || {
        username: process.env.manifacturerDefaultUsername,
        password: manufacturerDefaultPassword // Use manufacturer password 
      };
    } else {
      return userData.admin || {
        username: 'admin',
        password: adminDefaultPassword // Use defaultPassword 
      };  
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    // If an error occurs while loading user data, return default admin credentials
    return {
      username: null,
      password: null 
    };
  }
}

function saveUserData(adminData) {
  try {
      // Read existing data from userData.json file
      let existingData = {};
      try {
          existingData = JSON.parse(fs.readFileSync('userData.json'));
      } catch (error) {
          // If userData.json doesn't exist or is invalid JSON, just use an empty object
      }

      // Update the admin part with the new adminData
      existingData.admin = adminData;

      // Write the updated data back to userData.json file
      fs.writeFileSync('userData.json', JSON.stringify(existingData));
      console.log("Admin data saved successfully.");
  } catch (error) {
      console.error("Error saving admin data:", error);
  }
}

async function hashPassword(password) {
  const saltRounds = 10; // Number of salt rounds for bcrypt
  return await bcrypt.hash(password, saltRounds);
}

let userDataFileCreated = false;
app.on('ready', async () => {
  // Create the userData.json file if it hasn't been created yet
  if (!userDataFileCreated) {
      await createDefaultUserDataFile(); // Await the creation of the file
      userDataFileCreated = true; // Update the flag to indicate the file has been created
  }
});

// Function to create the userData.json file with default values
async function createDefaultUserDataFile() {
  const userDataFilePath = 'userData.json';
  try {
      // Await the hashing of default passwords
      await hashDefaultPass();
      
      // Create default user data
      const defaultUserData = {
          manufacturer: {
              username: process.env.manufacturerDefaultUsername,
              password: manufacturerDefaultPassword
          },
          admin: {
              username: 'admin',
              password: adminDefaultPassword
          }
      };
      
      // Write default user data to userData.json file
      fs.writeFileSync(userDataFilePath, JSON.stringify(defaultUserData));
      console.log("userData.json created with default values.");
  } catch (error) {
      console.error("Error creating userData.json:", error);
  }
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

/*------------------------------------------------------------*/
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

process.on("data", function(packetBuffer) {
  diagnosticsWindow.webContents.send("getPacketData", packetBuffer)
})

if(diagnosticsWindow){
  diagnosticsWindow.on('closed', () => {
    usbSendStopSignal(openedDevice);
  });
}

ipcMain.on("sendAdminConfigData", (event, configData) => {
  usbSendAdminConfigData(openedDevice, configData);
})

ipcMain.on("sendFactoryResetSignal", () => {
  usbSendFactoryResetSignal(openedDevice);
})


/*------------------save window--------------------------*/
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
    defaultPath: `mb_packets_${formattedDateTime}`, 
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