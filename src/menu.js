const { BrowserWindow, Menu } = require('electron');
const { importFiles } = require('./model');

exports.createMenu = createMenu;

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Import',
        accelerator: 'CmdOrCtrl+I',
        click: importFiles
      },
      { type: 'separator' },
      { role: 'quit' },
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Navigate',
    submenu: [
      {
        label: 'Next Activity',
        accelerator: 'Right',
        click: () => notify('goto-next-activity')
      },
      {
        label: 'Previous Activity',
        accelerator: 'Left',
        click: () => notify('goto-prev-activity')
      },
      { type: 'separator' },
      {
        label: 'Next Month',
        accelerator: 'Down',
        click: () => notify('goto-next-month')
      },
      {
        label: 'Previous Month',
        accelerator: 'Up',
        click: () => notify('goto-prev-month')
      }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

function createMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

function notify(channel, ...args) {
  BrowserWindow.getAllWindows().forEach(win => win.webContents.send(channel, ...args));
}
