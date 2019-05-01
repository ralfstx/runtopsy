const { Menu } = require('electron');
const { notifyMain, notifyRenderer } = require('./broadcast');

module.exports = {
  createMenu
};

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Import',
        accelerator: 'CmdOrCtrl+I',
        click: () => notifyMain('import')
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
    label: 'Go',
    submenu: [
      {
        label: 'Previous Activity',
        accelerator: 'Left',
        click: () => notifyRenderer('goto-prev-activity')
      },
      {
        label: 'Next Activity',
        accelerator: 'Right',
        click: () => notifyRenderer('goto-next-activity')
      },
      {
        label: 'First Activity',
        accelerator: 'Home',
        click: () => notifyRenderer('goto-first-activity')
      },
      {
        label: 'Last Activity',
        accelerator: 'End',
        click: () => notifyRenderer('goto-last-activity')
      },
      { type: 'separator' },
      {
        label: 'Previous Month',
        accelerator: 'Up',
        click: () => notifyRenderer('goto-prev-month')
      },
      {
        label: 'Next Month',
        accelerator: 'Down',
        click: () => notifyRenderer('goto-next-month')
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
