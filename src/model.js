const { join } = require('path');
const { homedir } = require('os');
const { BrowserWindow } = require('electron');
const { ensureDir, readdir, readJson, stat, writeJson } = require('fs-extra');
const { readJsonSafe } = require('./files');

module.exports = {
  createModel
};

function createModel() {

  let $configDir = ensureConfigDir();
  let $dbDir = ensureDbDir();
  let $config = readConfig();
  let $activities = loadActivities();
  // TODO extract to updater module
  let updating = false;

  return {
    getConfigDir,
    getConfig,
    getActivities,
    addActivity
  };

  async function getConfigDir() {
    return await $configDir;
  }

  async function getConfig() {
    return await $config;
  }

  async function getActivities() {
    let activities = await $activities;
    return Object.values(activities);
  }

  async function addActivity(activity) {
    await storeActivityToFile(activity);
    let activities = await $activities;
    activities[activity.id] = activity;
    scheduleUpdate();
  }

  function scheduleUpdate() {
    if (updating) return;
    updating = true;
    setTimeout(() => doUpdate().catch(console.error), 1000);
  }

  async function doUpdate() {
    updating = false;
    let activities = await $activities;
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send('activities', Object.values(activities)));
  }

  async function storeActivityToFile(activity) {
    let dbDir = await $dbDir;
    let file = join(dbDir, activity.id + '.json');
    await writeJson(file, activity);
  }

  async function loadActivities() {
    let dbDir = await $dbDir;
    let files = await findActivityFiles(dbDir);
    let activities = {};
    for (let file of files) {
      let activity = await readJson(file);
      activities[activity.id] = activity;
    }
    return activities;
  }

  async function findActivityFiles(dir) {
    let names = await readdir(dir);
    return Promise.all(names.map(name => join(dir, name)).filter(async file => {
      if (file.toLowerCase().endsWith('.json')) {
        let stats = await stat(file);
        return stats.isFile();
      }
      return false;
    }));
  }

  async function readConfig() {
    let configDir = await $configDir;
    let configFile = join(configDir, 'config.json');
    return await readJsonSafe(configFile, {});
  }

  async function ensureConfigDir() {
    let home = await homedir();
    let configDir = join(home, '.running');
    await ensureDir(configDir);
    return configDir;
  }

  async function ensureDbDir() {
    let configDir = await $configDir;
    let dbDir = join(configDir, 'db');
    await ensureDir(dbDir);
    return dbDir;
  }

}
