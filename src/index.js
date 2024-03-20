const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}
let isPasswordSet = true;

let mainWidth = 800;
let mainHeight = 600;
/*---------------main window------------------*/
let mainWindow; let startPage;
const createMainWindow = () => {
  if (isPasswordSet)
    startPage = 'index.html';
  else
    startPage = 'pages/main/main.html';
  createWindow(mainWindow, mainWidth, mainHeight, startPage, false);
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
  searchWindow = createWindow(searchWindow, sideWidth, sideHeight, 'pages/main/search-config.html', false)
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
  configWindow = createWindow(configWindow, mainWidth, mainHeight, 'pages/config/mode-config.html', false)
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
  settingsWindow = createWindow(settingsWindow, sideWidth, sideHeight + 200, 'pages/main/settings.html', false)
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


/*-------------------------------------------------------*/
function createWindow(window, width, height, htmlFile, resizable) {
  if (!window || window.isDestroyed()) {
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
  if (window) {
    window.close();
    window = null;
  }
}


function resizeWindow(window) {
  window.setSize(sideWidth, window.getBounds().height - 25, true);
}