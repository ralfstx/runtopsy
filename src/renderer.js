(function() {

  const ipc = window.ipc;
  const humanizeDuration = window.humanizeDuration;
  const { addMonths, closestIndexTo, endOfMonth, format, isAfter, isBefore, subMonths } = window.dateFns;
  const CalendarView = window.runtopsy.CalendarView;
  const MapView = window.runtopsy.MapView;

  let activities = {};
  let orderedActivities = [];
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
      addActivity(activity);
    });
    ipc.on('goto-next-activity', () => selectActivity(getNextActivity()));
    ipc.on('goto-prev-activity', () => selectActivity(getPrevActivity()));
    ipc.on('goto-next-month', () => selectActivity(getNextMonthActivity()));
    ipc.on('goto-prev-month', () => selectActivity(getPrevMonthActivity()));
    ipc.send('get-config');
    ipc.send('get-activities');
  }

  function initCalendar() {
    calendar = CalendarView.create('calendar', {
      onClick: a => selectActivity(a.id)
    });
  }

  function initMap() {
    map = MapView.create('map');
  }

  async function addActivity(activity) {
    activities[activity.id] = activity;
    let orderedIds = Object.keys(activities).sort((a, b) => parseInt(a) - parseInt(b));
    orderedActivities = orderedIds.map(id => activities[id]);
    calendar.showActivities(orderedActivities);
  }

  function getNextActivity() {
    if (!currentActivity) return;
    let currentIndex = orderedActivities.indexOf(currentActivity);
    if (currentIndex !== -1 && currentIndex < orderedActivities.length - 1) {
      return orderedActivities[currentIndex + 1];
    }
  }

  function getPrevActivity() {
    if (!currentActivity) return;
    let currentIndex = orderedActivities.indexOf(currentActivity);
    if (currentIndex !== -1 && currentIndex > 0) {
      return orderedActivities[currentIndex - 1];
    }
  }

  function getNextMonthActivity() {
    if (!currentActivity) return;
    let monthEnd = endOfMonth(currentActivity.start);
    let candidates = orderedActivities.filter(a => isAfter(a.start, monthEnd));
    let index = closestIndexTo(addMonths(currentActivity.start, 1), candidates.map(a => a.start));
    return candidates[index] || null;
  }

  function getPrevMonthActivity() {
    if (!currentActivity) return;
    let monthStart = endOfMonth(currentActivity.start);
    let candidates = orderedActivities.filter(a => isBefore(a.start, monthStart));
    let index = closestIndexTo(subMonths(currentActivity.start, 1), candidates.map(a => a.start));
    return candidates[index] || null;
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
    let date = format(activity.start, 'dddd, MMMM D, YYYY');
    let start = format(activity.start, 'H:mm');
    let end = format(activity.end, 'H:mm');
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
