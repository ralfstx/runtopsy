const { join } = require('path');
const { BrowserWindow, session } = require('electron');
const { ensureDir, readdir, writeJson } = require('fs-extra');
const { readJsonSafe } = require('./files');
const { buildQuery, getJson, postJson } = require('./rest-api');

module.exports = {
  createImporter
};

const apiBaseUrl = 'https://www.strava.com/api/v3';

function createImporter(model) {

  let access_token;

  return {
    importNewActivities
  };

  async function importNewActivities() {

    let config = await model.getConfig();
    let metadata = await readMetadata();
    await ensureAccessToken();
    let authHeader = {Authorization: `Bearer ${access_token}`};
    await requestActivities();
    await updateDb();

    async function ensureAccessToken() {
      if (!access_token) {
        let refresh_token = metadata.refresh_token;
        if (refresh_token) {
          let response = await requestAccessToken({refresh_token});
          access_token = response.access_token;
        } else {
          let code = await requestAuthorization();
          let response = await requestAccessToken({code});
          metadata = await updateMetadata({refresh_token: response.refresh_token});
          access_token = response.access_token;
        }
      }
    }

    async function requestAuthorization() {
      return new Promise((resolve, reject) => {
        let authWindow = new BrowserWindow({
          width: 800, height: 600,
          title: 'Authenticate with Strava',
          show: false,
          autoHideMenuBar: true,
          icon: join(__dirname, '../icons/512x512.png'),
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: false
          }
        });
        let redirectUrl = 'https://ralfstx.github.io/';
        let queryParams = {
          client_id: config.importers.strava.client_id,
          redirect_uri: redirectUrl,
          response_type: 'code',
          scope: 'activity:read_all'
        };
        let query = buildQuery(queryParams);
        let authUrl = 'https://www.strava.com/oauth/authorize?' + query;
        session.defaultSession.webRequest.onBeforeRedirect(async (details) => {
          if (details.redirectURL.startsWith(redirectUrl)) {
            authWindow.destroy();
            let codeMatch = /code=([^&]*)/.exec(details.redirectURL) || null;
            let code = (codeMatch && codeMatch.length > 1) ? codeMatch[1] : null;
            let error = /\?error=(.+)$/.exec(details.redirectURL);
            if (code) {
              resolve(code);
            } else if (error) {
              reject(error);
            }
          }
        });
        authWindow.loadURL(authUrl);
        authWindow.show();
        authWindow.on('close', () => authWindow = null, false);
      });
    }

    async function requestAccessToken ({code, refresh_token}) {
      let data = Object.assign({
        client_id: config.importers.strava.client_id,
        client_secret: config.importers.strava.client_secret
      }, code ? {
        grant_type: 'authorization_code',
        code
      } : {
        grant_type: 'refresh_token',
        refresh_token
      });
      return await postJson('https://www.strava.com/oauth/token', data);
    }

    async function updateDb() {
      let activities = await model.getActivities();
      let allDbIds = activities.map(activity => activity.id);
      let stravaIds = await readIds();
      for (let id of stravaIds) {
        let prefixedId = `strava_${id}`;
        if (!allDbIds.includes(prefixedId)) {
          let activity = await readActivity(id);
          await model.addActivity(extractActivity(activity));
        }
      }
    }

    async function requestActivities() {
      let page = 1;
      let per_page = 100;
      let after = metadata.last_activity_start_time;
      let finished = false;
      console.log('requesting activities' + (after ? ` after ${after}` : ''));
      while (!finished) {
        let query = {page, per_page, after};
        let activities = await getJson(`${apiBaseUrl}/athlete/activities?${buildQuery(query)}`, authHeader);
        console.log(`received ${activities.length} activities`);
        await processActivities(activities);
        finished = activities.length !== per_page;
        page++;
      }
    }

    async function processActivities(activities) {
      let storageDir = await getActivitiesDir();
      for (let activity of activities) {
        let file = join(storageDir, `${activity.id}.json`);
        await writeJson(file, activity);
        await model.addActivity(extractActivity(activity));
      }
      await updateLastStartTime(activities);
    }

    async function readIds() {
      let activitiesDir = await getActivitiesDir();
      let files = await readdir(activitiesDir);
      return files.filter(name => name.endsWith('.json')).map(name => name.replace(/\.json$/, ''));
    }

    async function updateLastStartTime(activities) {
      let startTimes = activities.map(activity => Date.parse(activity.start_date) / 1000);
      let lastStartTime = Math.max.apply(null, startTimes);
      let metadata = await readMetadata();
      let previousLastStartTime = metadata.last_activity_start_time;
      if (!previousLastStartTime || previousLastStartTime < lastStartTime) {
        await updateMetadata({last_activity_start_time: lastStartTime});
      }
    }
  }

  async function readMetadata() {
    let storageDir = await getStorageDir();
    let metadataFile = join(storageDir, 'metadata.json');
    return await readJsonSafe(metadataFile, {});
  }

  async function updateMetadata(data) {
    let storageDir = await getStorageDir();
    let metadataFile = join(storageDir, 'metadata.json');
    let metadata = await readJsonSafe(metadataFile, {});
    await writeJson(metadataFile, Object.assign(metadata, data), {spaces: 2});
    return metadata;
  }

  async function readActivity(id) {
    let activitiesDir = await getActivitiesDir();
    let activityFile = join(activitiesDir, `${id}.json`);
    return await readJsonSafe(activityFile, {});
  }

  async function getActivitiesDir() {
    let storageDir = await getStorageDir();
    let activitiesDir = join(storageDir, 'activities');
    await ensureDir(activitiesDir);
    return activitiesDir;
  }

  async function getStorageDir() {
    let configDir = await model.getConfigDir();
    let storageDir = join(configDir, 'strava');
    await ensureDir(storageDir);
    return storageDir;
  }

  function extractActivity(activity) {
    let startTime = Date.parse(activity.start_date_local);
    return {
      id: startTime.toString(),
      type: mapType(activity.type),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(startTime + activity.elapsed_time * 1000).toISOString(),
      distance: activity.distance,
      moving_time: activity.moving_time,
      avg_speed: activity.average_speed,
      track_polyline: activity.map && activity.map.summary_polyline,
      records: []
    };
  }

  function mapType(type) {
    switch (type) {
    case 'Run':
      return 'running';
    default:
      return 'other';
    }
  }

}
