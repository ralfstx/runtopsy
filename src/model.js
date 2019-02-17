const { basename, join, normalize } = require('path');
const { homedir } = require('os');
const { copy, ensureDir, ensureFile, readdir, readJson, stat } = require('fs-extra');
const { BrowserWindow, dialog, ipcMain } = require('electron');
const { readFitFile } = require('./fit');

exports.createModel = createModel;
exports.importFiles = importFiles;

let config = null;
let activities = {};

ipcMain.on('get-config', async (event) => {
  await initialize();
  event.sender.send('config', config);
});
ipcMain.on('get-activities', (event) => {
  for (let id in activities) {
    event.sender.send('activity', activities[id]);
  }
});

async function createModel() {
  await initialize();
  let files = await findFitFiles(config.filesDir);
  for (let file of files) {
    await loadFile(file);
  }
}

async function importFiles() {
  await initialize();
  let importDir = normalize(config.importDir);
  if (!importDir) {
    dialog.showErrorBox('Import failed', 'Import directory not configured');
    return;
  }
  let stats = await stat(importDir).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    dialog.showErrorBox('Import failed', 'Not a directory: ' + importDir);
    return;
  }
  let files = await findFitFiles(importDir);
  for (let file of files) {
    await importFile(file);
  }
}

async function importFile(file) {
  let localFile = join(config.filesDir, basename(file));
  let exists = await stat(localFile).catch(() => null);
  if (!exists) {
    console.log('importing', localFile);
    await copy(file, localFile);
    await loadFile(localFile);
  }
}

async function loadFile(file) {
  console.log('loading', file);
  let data = await readFitFile(file);
  if (data.activity) {
    processActivity(data.activity);
  }
}

async function processActivity(activity) {
  let sessions = activity.sessions || [];
  for (let session of sessions) {
    processSession(session);
  }
}

async function processSession(session) {
  let activity = extractActivity(session);
  activities[activity.id] = activity;
  BrowserWindow.getAllWindows().forEach(win => win.webContents.send('activity', activity));
}

function extractActivity(session) {
  let records = session.laps
    .map(lap => lap.records)
    .reduce((a, b) => a.concat(b), [])
    .map(record => extractRecord(record));
  let activity = {
    id: Date.parse(session.start_time).toString(),
    type: session.sport,
    start: session.start_time,
    end: session.timestamp,
    distance: session.total_distance,
    movingTime: session.total_timer_time,
    avgSpeed: session.avg_speed,
    records
  };
  return activity;
}

function extractRecord(record) {
  let result = {};
  // some records have no position
  if ('position_lat' in record && 'position_long' in record) {
    result.position = [record.position_lat, record.position_long];
  }
  return result;
}

async function findFitFiles(dir) {
  let names = await readdir(dir);
  return Promise.all(names.map(name => join(dir, name)).filter(async file => {
    if (file.toLowerCase().endsWith('.fit')) {
      let stats = await stat(file);
      return stats.isFile();
    }
    return false;
  }));
}

async function initialize() {
  if (!config) {
    config = await readConfig();
  }
}

async function readConfig() {
  let home = await homedir();
  let configDir = join(home, '.running');
  await ensureDir(configDir);
  let filesDir = join(configDir, 'files');
  await ensureDir(filesDir);
  let configFile = join(configDir, 'config.json');
  await ensureFile(configFile);
  let config = await readJson(configFile).catch(() => {});
  return Object.assign({}, config, { filesDir });
}
