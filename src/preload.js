const { ipcRenderer } = require('electron');

// @ts-ignore
window.ipc = ipcRenderer;
