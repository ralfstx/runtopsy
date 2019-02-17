const { join } = require('path');
const { app, BrowserWindow, shell } = require('electron');
const { createModel } = require('./model');
const { createMenu } = require('./menu');

let mainWindow;

app.on('ready', () => {
  createModel();
  createWindow();
  createMenu();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 850, height: 850,
    title: 'Runtopsy',
    autoHideMenuBar: true,
    icon: join(__dirname, '../icons/512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('static/index.html');
  mainWindow.on('closed', () => mainWindow = null);
  //mainWindow.webContents.openDevTools();
  // open links in external browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
}
