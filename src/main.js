const { join } = require('path');
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createModel } = require('./model');
const { createMenu } = require('./menu');
const { createImporter } = require('./importer-strava');

let mainWindow;
let model = createModel();

ipcMain.on('get-config', (event) => {
  model.getConfig().then(config => event.sender.send('config', config)).catch(console.error);
});
ipcMain.on('get-activities', (event) => {
  model.getActivities().then(activities => {
    for (let activity of activities) {
      event.sender.send('activity', activity);
    }
  }).catch(console.error);
});
ipcMain.on('import', () => {
  startImport().catch(console.error);
});

app.on('ready', () => {
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

async function startImport() {
  let importer = createImporter(model);
  await importer.importFiles(async activity => {
    await model.addActivity(activity);
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send('activity', activity));
  });
}

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
  // open links in external browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
}
