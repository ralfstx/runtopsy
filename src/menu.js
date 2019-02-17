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
        click: gotoNextActivitiy
      },
      {
        label: 'Previous Activity',
        accelerator: 'Left',
        click: gotoPrevActivitiy
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

function gotoNextActivitiy() {
  BrowserWindow.getAllWindows().forEach(win => win.webContents.send('goto-next-activity'));
}

function gotoPrevActivitiy() {
  BrowserWindow.getAllWindows().forEach(win => win.webContents.send('goto-prev-activity'));
}
