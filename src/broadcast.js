const { BrowserWindow, ipcMain } = require('electron');

module.exports = {
  notifyRenderer,
  notifyMain
};

function notifyRenderer(topic, ...args) {
  BrowserWindow.getAllWindows().forEach(win => win.webContents.send(topic, ...args));
}

function notifyMain(topic, ...args) {
  ipcMain.emit(topic, ...args);
}
