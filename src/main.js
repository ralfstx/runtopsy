const { join } = require('path');
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createModel } = require('./model');
const { createMenu } = require('./menu');
const { createImporter } = require('./importer');

let mainWindow;
let model = createModel();

ipcMain.on('get-config', async (event) => {
  event.sender.send('config', await model.getConfig());
});
ipcMain.on('get-activities', async (event) => {
  for (let activity of await model.getActivities()) {
    event.sender.send('activity', activity);
  }
});
ipcMain.on('import', async () => {
  await startImport();
});

app.on('ready', async () => {
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
  let config = await model.getConfig();
  let importer = createImporter(config);
  importer.importFiles(async activity => {
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
