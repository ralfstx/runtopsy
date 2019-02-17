const { Menu } = require('electron');
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
