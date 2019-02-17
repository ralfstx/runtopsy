const { ipcRenderer } = require('electron');
const moment = require('moment');
const humanizeDuration = require('humanize-duration');
const L = require('leaflet');
const $ = require('jquery');
require('fullcalendar');

let activities = {};
let events = [];
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
  ipcRenderer.on('activity', (event, activity) => {
    updateActivity(activity);
  });
  ipcRenderer.on('config', (event, config) => {
    initMapTileLayer(config.mapboxAccessToken);
  });
  ipcRenderer.send('get-config');
  ipcRenderer.send('get-activities');
}

function initCalendar() {
  $('#calendar').fullCalendar({
    defaultView: 'month',
    firstDay: 1,
    displayEventTime: false,
    timeFormat: 'H:mm',
    height: 350,
    events: (start, end, timezone, callback) => callback(events),
    eventClick: (event) => renderActivity(activities[event.activity])
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
    id: 'mapbox.streets',
    accessToken
  }).addTo(map);
}

async function updateActivity(activity) {
  activities[activity.id] = activity;
  events.push({
    title: `${activity.distance.toPrecision(2)} km`,
    start: activity.start,
    end: activity.end,
    color: activity.type === 'running' ? '#CC0033' : activity.type === 'walking' ? '#004E00' : '#7F8C8D',
    textColor: 'white',
    activity: activity.id
  });
  $('#calendar').fullCalendar('refetchEvents');
}

function renderActivity(activity) {
  let allPoints = activity.records
    .map(record => record.position)
    .filter(point => point != null);
  let polyline = L.polyline(allPoints, {color: 'red'});
  map.fitBounds(polyline.getBounds(), {padding: [10, 10]});
  currentLayer && currentLayer.removeFrom(map);
  polyline.addTo(map);
  currentLayer = polyline;
  document.getElementById('map').style.opacity = '1';
  let date = moment(activity.start).format('dddd, MMM D, YYYY');
  let start = moment(activity.start).format('H:mm');
  let end = moment(activity.end).format('H:mm');
  let distance = activity.distance.toPrecision(2) + ' km';
  document.getElementById('details-title').innerHTML = `<h3>${date} &nbsp; ${start} – ${end} &nbsp; ${activity.type}  &nbsp; ${distance}</h3>`;
  let time = humanizeDuration(activity.movingTime * 1000, { units: ['d', 'h', 'm'], round: true });
  let message = `Moving time: ${time} &nbsp; Average pace: ${(60 / activity.avgSpeed).toPrecision(2)}`;
  document.getElementById('info').innerHTML = message;
}
