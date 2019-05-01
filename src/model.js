const { join } = require('path');
const { homedir } = require('os');
const { throttle } = require('throttle-debounce');
const { ensureDir, readdir, readJson, writeJson } = require('fs-extra');
const { notifyRenderer } = require('./broadcast');
const { readJsonSafe } = require('./files');

module.exports = {
  createModel
};

function createModel() {

  const $configDir = ensureConfigDir();
  const $dbDir = ensureDbDir();
  const $dbActivitiesDir = ensureDbActivitiesDir();
  const $dbRecordsDir = ensureDbRecordsDir();
  const $config = readConfig();
  const $activities = loadActivities();
  const $recordIds = loadRecordIds();
  const updateRendererThrottled = throttle(250, () => updateRenderer().catch(console.error));

  return {
    getConfigDir,
    getConfig,
    getActivities,
    getActivityRecords,
    getActivityIdsWithRecords,
    addActivity,
    addActivityRecords
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

  async function getActivityRecords(activityId) {
    let dbRecordsDir = await $dbRecordsDir;
    let recordsFile = join(dbRecordsDir, `${activityId}.json`);
    let recordStream = await readJsonSafe(recordsFile, {});
    let records = extractRecordsFromStream(recordStream);
    return {activityId, records};
  }

  async function getActivityIdsWithRecords() {
    return await $recordIds;
  }

  async function addActivity(activity) {
    await storeActivityToFile(activity);
    let activities = await $activities;
    activities[activity.id] = activity;
    updateRendererThrottled();
  }

  async function updateRenderer() {
    let activities = await $activities;
    notifyRenderer('activities', Object.values(activities));
  }

  async function addActivityRecords(activityId, records) {
    await storeRecordsToFile(activityId, records);
    let recordIds = await $recordIds;
    if (!recordIds.includes(activityId)) {
      recordIds.push(activityId);
    }
  }

  async function storeActivityToFile(activity) {
    let dbActivitiesDir = await $dbActivitiesDir;
    let file = join(dbActivitiesDir, `${activity.id}.json`);
    await writeJson(file, activity);
  }

  async function storeRecordsToFile(activityId, records) {
    let dbRecordsDir = await $dbRecordsDir;
    let file = join(dbRecordsDir, `${activityId}.json`);
    await writeJson(file, records);
  }

  async function loadActivities() {
    let dbActivitiesDir = await $dbActivitiesDir;
    let ids = await findIdsFromJsonFiles(dbActivitiesDir);
    let activities = {};
    for (let id of ids) {
      let activity = await readJson(join(dbActivitiesDir, `${id}.json`));
      activities[activity.id] = activity;
    }
    return activities;
  }

  async function loadRecordIds() {
    let dbRecordsDir = await $dbRecordsDir;
    return await findIdsFromJsonFiles(dbRecordsDir);
  }

  async function findIdsFromJsonFiles(dir) {
    let names = await readdir(dir);
    return names.filter(name => name.endsWith('.json')).map(name => name.replace(/\.json$/, ''));
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

  async function ensureDbActivitiesDir() {
    let dbDir = await $dbDir;
    let activitiesDir = join(dbDir, 'activities');
    await ensureDir(activitiesDir);
    return activitiesDir;
  }

  async function ensureDbRecordsDir() {
    let dbDir = await $dbDir;
    let recordsDir = join(dbDir, 'records');
    await ensureDir(recordsDir);
    return recordsDir;
  }

  async function ensureDbDir() {
    let configDir = await $configDir;
    let dbDir = join(configDir, 'db');
    await ensureDir(dbDir);
    return dbDir;
  }

  function extractRecordsFromStream(stream) {
    let createRecord = (i) => ({
      time: stream.time[i],
      distance: stream.distance[i],
      position: stream.position[i],
      speed: stream.speed[i]
    });
    return stream && stream.time ? Array.from(Array(stream.time.length)).map((el, i) => createRecord(i)) : [];
  }

}
