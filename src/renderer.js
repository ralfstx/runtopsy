(function() {

  // @ts-ignore
  const ipc = window.ipc;
  // @ts-ignore
  const humanizeDuration = window.humanizeDuration;
  // @ts-ignore
  const { DateTime } = window.luxon;
  // @ts-ignore
  const CalendarView = window.runtopsy.CalendarView;
  // @ts-ignore
  const MapView = window.runtopsy.MapView;

  let activities = {};
  let currentActivity = null;
  let calendar;
  let map;

  initCalendar();
  initMap();
  initIpc();

  function initIpc() {
    ipc.on('config', (event, config) => {
      map.showTiles(config.mapboxAccessToken);
    });
    ipc.on('activity', (event, activity) => {
      updateActivity(activity);
    });
    ipc.on('goto-next-activity', () => {
      selectActivity(getNextActivity());
    });
    ipc.on('goto-prev-activity', () => {
      selectActivity(getPrevActivity());
    });
    ipc.send('get-config');
    ipc.send('get-activities');
  }

  function initCalendar() {
    // @ts-ignore
    calendar = CalendarView.create('calendar', {
      onClick: a => selectActivity(a.id)
    });
  }

  function initMap() {
    map = MapView.create('map');
  }

  async function updateActivity(activity) {
    activities[activity.id] = activity;
    let orderedIds = getOrderedActivityIds();
    let orderedActivities = orderedIds.map(id => activities[id]);
    calendar.showActivities(orderedActivities);
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

  function selectActivity(activity) {
    if (!activity) return;
    if (typeof activity === 'string') activity = activities[activity];
    if (currentActivity === activity) return;
    currentActivity = activity;
    showDetails();
    updateMap(activity);
    updateTitle(activity);
    updateResults(activity);
    calendar.setActive(activity);
  }

  function showDetails() {
    document.getElementById('details').style.opacity = '1';
  }

  function updateTitle(activity) {
    let date = DateTime.fromISO(activity.start).toFormat('cccc, LLLL d, yyyy');
    let start = DateTime.fromISO(activity.start).toFormat('H:mm');
    let end = DateTime.fromISO(activity.end).toFormat('H:mm');
    let title = `${date} &nbsp; ${start} – ${end}`;
    document.getElementById('details-title').innerHTML = `<h3>${title}</h3>`;
  }

  function updateResults(activity) {
    let distance = activity.distance.toPrecision(2) + ' km';
    let avgPace = formatPace(60 / activity.avgSpeed);
    let movTime = humanizeDuration(activity.movingTime * 1000, { units: ['d', 'h', 'm'], round: true });
    document.getElementById('value-distance').innerText = distance;
    document.getElementById('value-avg-pace').innerText = avgPace;
    document.getElementById('value-mov-time').innerText = movTime;
  }

  function updateMap(activity) {
    map.showActivity(activity);
  }

  function formatPace(pace) {
    let minutes = Math.trunc(pace);
    let seconds = Math.round(pace % 1 * 60);
    return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
  }

})();
