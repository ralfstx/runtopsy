(function() {

  // @ts-ignore
  const ipc = window.ipc;
  // @ts-ignore
  const humanizeDuration = window.humanizeDuration;
  // @ts-ignore
  const { format, startOfMonth } = window.dateFns;
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
    // @ts-ignore
    calendar = CalendarView.create('calendar', {
      onClick: a => selectActivity(a.id)
    });
  }

  function initMap() {
    map = MapView.create('map');
  }

  async function addActivity(activity) {
    activities[activity.id] = activity;
    let orderedIds = getOrderedActivityIds();
    let orderedActivities = orderedIds.map(id => activities[id]);
    calendar.showActivities(orderedActivities);
  }

  function getNextActivity() {
    if (!currentActivity) return;
    let orderedIds = getOrderedActivityIds();
    let currentIndex = orderedIds.indexOf(currentActivity.id);
    if (currentIndex !== -1 && currentIndex < orderedIds.length - 1) {
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

  function getNextMonthActivity() {
    if (!currentActivity) return;
    let orderedIds = getOrderedActivityIds();
    let currentMonth = startOfMonth(currentActivity.start);
    let index = orderedIds.indexOf(currentActivity.id);
    while (index !== -1 && index < orderedIds.length - 1) {
      index++;
      let activity = activities[orderedIds[index]];
      if (startOfMonth(activity.start) > currentMonth) {
        return activity;
      }
    }
  }

  function getPrevMonthActivity() {
    if (!currentActivity) return;
    let orderedIds = getOrderedActivityIds();
    let currentMonth = startOfMonth(currentActivity.start);
    let index = orderedIds.indexOf(currentActivity.id);
    while (index !== -1 && index > 0) {
      index--;
      let activity = activities[orderedIds[index]];
      if (startOfMonth(activity.start) < currentMonth) {
        return activity;
      }
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
