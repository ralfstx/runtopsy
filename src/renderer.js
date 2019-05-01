(function() {

  const { humanizeDuration, ipc } = window;
  const { addMonths, closestIndexTo, endOfMonth, format, isAfter, isBefore, startOfMonth, subMonths } = window.dateFns;
  const { CalendarView, ChartView, MapView } = window.runtopsy;

  let activities = {};
  let orderedActivities = [];
  let currentActivity = null;
  let calendar;
  let chart;
  let map;

  initCalendar();
  initChart();
  initMap();
  initIpc();

  function initIpc() {
    ipc.on('config', (event, config) => {
      map.showTiles(config.mapboxAccessToken);
    });
    ipc.on('activities', (event, activities) => {
      addActivities(activities);
    });
    ipc.on('records', (event, activityRecords) => {
      updateRecords(activityRecords);
    });
    ipc.on('goto-first-activity', () => selectActivity(getFirstActivity()));
    ipc.on('goto-last-activity', () => selectActivity(getLastActivity()));
    ipc.on('goto-next-activity', () => selectActivity(getNextActivity() || getLastActivity()));
    ipc.on('goto-prev-activity', () => selectActivity(getPrevActivity() || getFirstActivity()));
    ipc.on('goto-next-month', () => selectActivity(getNextMonthActivity() || getLastActivity()));
    ipc.on('goto-prev-month', () => selectActivity(getPrevMonthActivity() || getFirstActivity()));
    ipc.send('get-config');
    ipc.send('get-activities');
  }

  function initCalendar() {
    calendar = CalendarView.create('calendar', {
      onClick: a => selectActivity(a.id)
    });
  }

  function initChart() {
    chart = ChartView.create('chart', {
      onHover: record => map.showPosition(record && record.position)
    });
  }

  function initMap() {
    map = MapView.create('map');
  }

  async function addActivities(activitiesToAdd) {
    for (let activity of activitiesToAdd) {
      activities[activity.id] = activity;
    }
    orderedActivities = Object.values(activities);
    orderedActivities.sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time));
    calendar.setActivities(orderedActivities);
  }

  async function updateRecords(activityRecords) {
    if (activityRecords.activityId === currentActivity.id) {
      let activity = Object.assign({}, currentActivity, {records: activityRecords.records});
      updateMap(activity);
      updateChart(activity);
    }
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

  function getFirstActivity() {
    return orderedActivities[0] || null;
  }

  function getLastActivity() {
    return orderedActivities[orderedActivities.length - 1] || null;
  }

  function getNextMonthActivity() {
    if (!currentActivity) return;
    let targetDate = addMonths(currentActivity.start_time, 1);
    let monthEnd = endOfMonth(currentActivity.start_time);
    let nextMonthEnd = endOfMonth(targetDate);
    let candidates = orderedActivities.filter(a => isAfter(a.start_time, monthEnd));
    // reduce candidates to next month if it's not empty
    if (candidates.some(a => !isAfter(a.start_time, nextMonthEnd))) {
      candidates = candidates.filter(a => !isAfter(a.start_time, nextMonthEnd));
    }
    let index = closestIndexTo(targetDate, candidates.map(a => a.start_time));
    return candidates[index] || null;
  }

  function getPrevMonthActivity() {
    if (!currentActivity) return;
    let targetDate = subMonths(currentActivity.start_time, 1);
    let monthStart = startOfMonth(currentActivity.start_time);
    let prevMonthStart = startOfMonth(targetDate);
    let candidates = orderedActivities.filter(a => isBefore(a.start_time, monthStart));
    // reduce candidates to previous month if it's not empty
    if (candidates.some(a => !isBefore(a.start_time, prevMonthStart))) {
      candidates = candidates.filter(a => !isBefore(a.start_time, prevMonthStart));
    }
    let index = closestIndexTo(targetDate, candidates.map(a => a.start_time));
    return candidates[index] || null;
  }

  function selectActivity(activity) {
    if (!activity) return;
    if (typeof activity === 'string') activity = activities[activity];
    if (currentActivity === activity) return;
    currentActivity = activity;
    showDetails();
    updateMap(activity);
    updateChart(activity);
    updateTitle(activity);
    updateResults(activity);
    calendar.setActive(activity);
    ipc.send('get-records', activity.id);
  }

  function showDetails() {
    Array.from(document.getElementsByClassName('details')).forEach(el => el.classList.remove('hidden'));
  }

  function updateTitle(activity) {
    let date = formatDate(activity.start_time, 'dddd, MMMM D, YYYY');
    let start_time = formatDate(activity.start_time, 'H:mm');
    let end_time = formatDate(activity.end_time, 'H:mm');
    let title = `${date} &nbsp; ${start_time} – ${end_time}`;
    document.getElementById('details-title').innerHTML = `<h3>${title}</h3>`;
  }

  function updateResults(activity) {
    let distance = (activity.distance / 1000).toPrecision(2) + ' km';
    let avgPace = formatPace(speedToPace(activity.avg_speed));
    let movTime = humanizeDuration(activity.moving_time * 1000, { units: ['d', 'h', 'm'], round: true });
    document.getElementById('value-distance').innerText = distance;
    document.getElementById('value-avg-pace').innerText = avgPace;
    document.getElementById('value-mov-time').innerText = movTime;
  }

  function updateMap(activity) {
    map.showActivity(activity);
  }

  function updateChart(activity) {
    chart.showActivity(activity);
  }

  function speedToPace(speed) {
    return speed > 0 ? 1000 / 60 / speed : 0;
  }

  function formatPace(pace) {
    let minutes = Math.trunc(pace);
    let seconds = Math.floor(pace % 1 * 60);
    return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
  }

  // format adds current UTC offset to formatted dates, use date-fns UTC functions when available
  // See https://github.com/date-fns/date-fns/issues/376
  function formatDate(dateString, formatString) {
    return format(getUtcDate(dateString), formatString);
  }

  function getUtcDate(dateString = Date.now()) {
    let date = new Date(dateString);
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    );
  }

})();
