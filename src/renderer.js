/* global $ L */
// @ts-ignore
const ipc = window.ipc;
// @ts-ignore
const moment = window.moment;
// @ts-ignore
const humanizeDuration = window.humanizeDuration;

let activities = {};
let currentActivity = null;
let map = null;
let mapTileLayer = null;
let currentLayer = null;

initUi();
initIpc();

function initUi() {
  initCalendar();
  initMap();
}

function initIpc() {
  ipc.on('config', (event, config) => {
    initMapTileLayer(config.mapboxAccessToken);
  });
  ipc.on('activity', (event, activity) => {
    updateActivity(activity);
  });
  ipc.on('goto-next-activity', () => {
    showActivity(getNextActivity());
  });
  ipc.on('goto-prev-activity', () => {
    showActivity(getPrevActivity());
  });
  ipc.send('get-config');
  ipc.send('get-activities');
}

function initCalendar() {
  $('#calendar').fullCalendar({
    defaultView: 'month',
    firstDay: 1,
    displayEventTime: false,
    timeFormat: 'H:mm',
    height: 345,
    events: (start, end, timezone, callback) => callback(getEvents()),
    eventClick: (event) => showActivity(activities[event.activity])
  });
}

function initMap() {
  map = L.map('map');
}

function initMapTileLayer(accessToken) {
  mapTileLayer && mapTileLayer.removeFrom(map);
  mapTileLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors,'
      + ' <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,'
      + ' Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    // @ts-ignore incomplete typings
    // alternative: 'mapbox.streets'
    id: 'mapbox.outdoors',
    accessToken
  }).addTo(map);
}

async function updateActivity(activity) {
  activities[activity.id] = activity;
  $('#calendar').fullCalendar('refetchEvents');
}

function getEvents() {
  let events = [];
  for (const id in activities) {
    let activity = activities[id];
    events.push({
      title: `${activity.distance.toPrecision(2)} km`,
      start: activity.start,
      end: activity.end,
      color: activity.type === 'running' ? '#CC0033' : activity.type === 'walking' ? '#004E00' : '#7F8C8D',
      textColor: 'white',
      activity: activity.id
    });
  }
  return events;
}

function getNextActivity() {
  if (!currentActivity) return;
  let orderedIds = getOrderedActivityIds();
  let currentIndex = orderedIds.indexOf(currentActivity.id);
  if (currentIndex !== -1 && currentIndex <= orderedIds.length) {
    return activities[orderedIds[currentIndex + 1]];
  }
}

function getPrevActivity() {
  if (!currentActivity) return;
  let orderedIds = getOrderedActivityIds();
  let currentIndex = orderedIds.indexOf(currentActivity.id);
  if (currentIndex !== -1 && currentIndex > 0) {
    return activities[orderedIds[currentIndex - 1]];
  }
}

function getOrderedActivityIds() {
  return Object.keys(activities).sort((a, b) => parseInt(a) - parseInt(b));
}

function showActivity(activity) {
  console.log('show', activity);
  if (!activity) return;
  if (currentActivity === activity) return;
  currentActivity = activity;
  let allPoints = activity.records
    .map(record => record.position)
    .filter(point => point != null);
  let polyline = L.polyline(allPoints, {color: 'red'});
  map.fitBounds(polyline.getBounds(), {padding: [10, 10]});
  currentLayer && currentLayer.removeFrom(map);
  polyline.addTo(map);
  currentLayer = polyline;
  document.getElementById('details').style.opacity = '1';
  let date = moment(activity.start).format('dddd, MMM D, YYYY');
  let start = moment(activity.start).format('H:mm');
  let end = moment(activity.end).format('H:mm');
  let distance = activity.distance.toPrecision(2) + ' km';
  let title = `${date} &nbsp; ${start} – ${end}`;
  document.getElementById('details-title').innerHTML = `<h3>${title}</h3>`;
  let avgPace = formatPace(60 / activity.avgSpeed);
  let movTime = humanizeDuration(activity.movingTime * 1000, { units: ['d', 'h', 'm'], round: true });
  document.getElementById('value-distance').innerText = distance;
  document.getElementById('value-avg-pace').innerText = avgPace;
  document.getElementById('value-mov-time').innerText = movTime;
}

function formatPace(pace) {
  let minutes = Math.trunc(pace);
  let seconds = Math.round(pace % 1 * 60);
  return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
}
