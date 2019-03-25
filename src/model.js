const { join } = require('path');
const { homedir } = require('os');
const { ensureDir, ensureFile, readdir, readJson, stat, writeJson } = require('fs-extra');

module.exports = {
  createModel
};

function createModel() {

  let $config = readConfig();
  let activities$ = loadActivities();

  return {
    getConfig,
    getActivities,
    addActivity
  };

  async function getConfig() {
    return await $config;
  }

  async function getActivities() {
    let activities = await activities$;
    return Object.values(activities);
  }

  async function addActivity(activity) {
    await storeActivityToFile(activity);
    let activities = await activities$;
    activities[activity.id] = activity;
  }

  async function storeActivityToFile(activity) {
    let config = await $config;
    let file = join(config.dbDir, activity.id + '.json');
    await writeJson(file, activity);
  }

  async function loadActivities() {
    let config = await $config;
    let files = await findActivityFiles(config.dbDir);
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
    let home = await homedir();
    let configDir = join(home, '.running');
    await ensureDir(configDir);
    let filesDir = join(configDir, 'files');
    await ensureDir(filesDir);
    let dbDir = join(configDir, 'db');
    await ensureDir(dbDir);
    let configFile = join(configDir, 'config.json');
    await ensureFile(configFile);
    let config = await readJson(configFile).catch(() => {});
    return Object.assign({}, config, { filesDir, dbDir });
  }

}
