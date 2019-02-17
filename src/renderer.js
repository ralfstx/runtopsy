/* global L d3 */
// @ts-ignore
const ipc = window.ipc;
// @ts-ignore
const humanizeDuration = window.humanizeDuration;
// @ts-ignore
const { DateTime, Interval } = window.luxon;

let activities = {};
let currentActivity = null;
let map = null;
let mapTileLayer = null;
let currentLayer = null;
let svg = null;
let firstDisplayMonth;
let nrDisplayMonth;

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
  svg = d3.select('#calendar')
    .append('svg:svg')
    .attr('width', '100%')
    .attr('height', '100%');
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
  let orderedIds = getOrderedActivityIds();
  let activityData = orderedIds.map(id => {
    let activity = activities[id];
    let distance = activity.distance.toPrecision(2) + ' km';
    let date = DateTime.fromISO(activity.start);
    return {id, distance, date};
  });
  let lastActivity = activityData[activityData.length - 1];
  nrDisplayMonth = 5;
  firstDisplayMonth = lastActivity.date.startOf('month').minus({months: nrDisplayMonth - 1});
  renderMonths();
  renderActivities(activityData);
}

function renderMonths() {
  let data = [];
  for (let i = 0; i < nrDisplayMonth; i++) {
    data.push(firstDisplayMonth.plus({months: i}));
  }
  let selection = svg.selectAll('.month')
    .data(data, d => d.toFormat('yyyy-LL'));
  // exiting
  selection.exit()
    .remove();
  // updating
  selection
    .transition().duration(500)
    .attr('transform', d => `translate(0,${getY(d)})`);
  // entering
  let entering = selection.enter()
    .append('g')
    .attr('class', 'month')
    .attr('transform', d => `translate(0,${getY(d)})`);
  entering.append('text')
    .attr('x', 5)
    .attr('y', -16)
    .text(d => d.toFormat('LLLL yyyy'));
  entering.each(function(d) {
    let group = d3.select(this);
    let firstDay = d.startOf('month');
    let lastDayOfMonth = d.endOf('month');
    while (firstDay.month == d.month) {
      let lastDay = firstDay.endOf('week');
      if (lastDay > lastDayOfMonth) lastDay = lastDayOfMonth;
      group.append('line')
        .attr('x1', getX(firstDay) - 7)
        .attr('x2', getX(lastDay) + 7)
        .attr('y1', 0)
        .attr('y2', 0);
      firstDay = lastDay.plus({days: 1});
    }
  });
}

function renderActivities(data) {
  let selection = svg.selectAll('.activity').data(data, d => d.id);
  // exiting
  selection.exit()
    .remove();
  // updating
  selection
    .transition().duration(500)
    .attr('cy', d => getY(d.date));
  // entering
  selection.enter()
    .append('circle')
    .attr('class', 'activity')
    .attr('r', 7)
    .attr('cx', d => getX(d.date))
    .attr('cy', d => getY(d.date))
    .on('click', d => showActivity(d.id));
}

function getX(dateTime) {
  return 10 + (dateTime.day - 1) * 22;
}

function getY(dateTime) {
  let diff = Interval.fromDateTimes(firstDisplayMonth, dateTime.startOf('month')).length('months');
  return 40 + diff * 50;
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
  if (!activity) return;
  if (typeof activity === 'string') activity = activities[activity];
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
  let date = DateTime.fromISO(activity.start).toFormat('cccc, LLLL d, yyyy');
  let start = DateTime.fromISO(activity.start).toFormat('H:mm');
  let end = DateTime.fromISO(activity.end).toFormat('H:mm');
  let distance = activity.distance.toPrecision(2) + ' km';
  let title = `${date} &nbsp; ${start} – ${end}`;
  document.getElementById('details-title').innerHTML = `<h3>${title}</h3>`;
  let avgPace = formatPace(60 / activity.avgSpeed);
  let movTime = humanizeDuration(activity.movingTime * 1000, { units: ['d', 'h', 'm'], round: true });
  document.getElementById('value-distance').innerText = distance;
  document.getElementById('value-avg-pace').innerText = avgPace;
  document.getElementById('value-mov-time').innerText = movTime;
  svg.selectAll('.activity')
    .classed('selected', d => d.id === activity.id)
    .attr('r', d => d.id === activity.id ? 8 : 7);
}

function formatPace(pace) {
  let minutes = Math.trunc(pace);
  let seconds = Math.round(pace % 1 * 60);
  return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
}
