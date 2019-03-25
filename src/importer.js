const { basename, join, normalize } = require('path');
const { copy, readdir, stat } = require('fs-extra');
const { dialog } = require('electron');
const { readFitFile } = require('./fit');

module.exports = {
  createImporter
};

function createImporter(config) {

  let importDir = normalize(config.importDir);

  return {
    importFiles
  };

  async function importFiles(callback) {
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
      callback(activity);
    }

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
    let result = {
      time: record.timestamp,
      elapsed: record.elapsed_time,
      distance: record.distance,
      speed: record.speed
    };
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

}
