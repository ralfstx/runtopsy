/* global d3 */
(function() {

  const { addDays, addMonths, differenceInCalendarWeeks, differenceInMonths, endOfMonth, endOfWeek, format, getDate,
    isSameMonth, startOfMonth, subMonths } = window.dateFns;
  const weekStartsOn = 1;
  const xMargin = 10;
  const yMargin = 10;

  window.runtopsy.CalendarView = { create };

  function create(id, options = {}) {

    let activities = [];
    let selected = null;
    let activitiesByMonth = {};
    let rowCount = Math.max(1, options.rowCount || 4);
    let firstMonth = options.firstMonth || subMonths(startOfMonth(Date.now()), rowCount - 1);
    let lastScrollOffset = 0;
    let onClick = options.onClick || (() => {});
    let svg = d3.select(`#${id}`)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%');

    renderMonths();

    return {
      setActivities,
      setActive
    };

    function setActivities(newActivities) {
      activities = newActivities;
      updateActivitiesByMonth();
      renderActivities();
      renderTotals();
    }

    function setActive(activity) {
      selected = activity;
      renderCursor();
      showMonth(startOfMonth(selected.start_time));
      renderActivities();
      renderTotals();
    }

    function updateActivitiesByMonth() {
      activitiesByMonth = {};
      for (let activity of activities) {
        let month = monthString(startOfMonth(activity.start_time));
        activitiesByMonth[month] = activitiesByMonth[month] || [];
        activitiesByMonth[month].push(activity);
      }
    }

    function renderMonths() {
      let months = Array.from(Array(rowCount).keys())
        .map(i => addMonths(firstMonth, i));
      let selection = svg.selectAll('.month')
        .data(months, d => monthString(d));
      // exiting
      selection.exit()
        .transition(75)
        .attr('transform', d => `translate(0,${getY(addMonths(d, -lastScrollOffset))})`)
        .remove();
      // updating
      selection
        .transition(75)
        .attr('transform', d => `translate(0,${getY(d)})`);
      // entering
      let entering = selection.enter()
        .append('g')
        .attr('class', 'month')
        .attr('transform', d => `translate(0,${getY(addMonths(d, lastScrollOffset))})`);
      entering.append('text')
        .attr('x', xMargin)
        .attr('y', -14)
        .text(d => format(d, 'MMMM YYYY'));
      entering.append('text')
        .attr('class', 'month-total-distance')
        .attr('x', getX('2000-12-31T00:00:00Z') + 100)
        .attr('y', 4)
        .attr('text-anchor', 'end');
      entering.selectAll('.week').data(month => getWeeks(month)).enter()
        .append('line')
        .attr('class', 'week')
        .attr('x1', d => getX(d.firstDay) - 12)
        .attr('x2', d => getX(d.lastDay) + 12)
        .attr('y1', 0)
        .attr('y2', 0);
      entering
        .transition(75)
        .attr('transform', d => `translate(0,${getY(d)})`);
    }

    function renderActivities() {
      let selection = svg.selectAll('.month').selectAll('.activity')
        .data(month => getActivitiesForMonth(month), activity => activity.id);
      selection.exit()
        .remove();
      let entering = selection.enter()
        .append('g')
        .attr('class', 'activity')
        .attr('transform', d => `translate(${getX(d.start_time)},0)`);
      entering
        .append('circle')
        .attr('class', d => d.type)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 7)
        .on('click', d => onClick(d));
      entering
        .append('text')
        .attr('x', 0)
        .attr('y', 12)
        .attr('alignment-baseline', 'hanging')
        .attr('text-anchor', 'middle')
        .text(d => getDistanceFormatted(d.distance));
    }

    function getActivitiesForMonth(month) {
      return activitiesByMonth[monthString(month)] || [];
    }

    function getWeeks(month) {
      let weeks = [];
      let firstDay = startOfMonth(month);
      let lastDayOfMonth = endOfMonth(month);
      while (isSameMonth(firstDay, month)) {
        let lastDay = endOfWeek(firstDay, {weekStartsOn});
        if (lastDay > lastDayOfMonth) lastDay = lastDayOfMonth;
        weeks.push({firstDay, lastDay});
        firstDay = addDays(lastDay, 1);
      }
      return weeks;
    }

    function renderTotals() {
      svg.selectAll('.month-total-distance')
        .text(d => getTotalDistanceOfMonthFormatted(d));
    }

    function getDistanceFormatted(distance) {
      return distance > 0 ? (distance / 1000).toPrecision(2) : '';
    }

    function getTotalDistanceOfMonthFormatted(date) {
      let activities = activitiesByMonth[monthString(date)] || [];
      let totalDistance = activities.reduce((p, v) => p + v.distance / 1000, 0);
      return totalDistance ? Math.floor(totalDistance) + ' km' : '';
    }

    function renderCursor() {
      let selectedMonth = selected ? startOfMonth(selected.start_time) : null;
      let selection = svg.selectAll('.month').selectAll('.cursor')
        .data(month => isSameMonth(month, selectedMonth) ? [selected] : [], d => d.id);
      // exiting
      selection.exit()
        .remove();
      // updating
      selection
        .attr('cx', d => getX(d.start_time));
      // entering
      selection.enter()
        .append('circle')
        .attr('class', 'cursor')
        .attr('r', 11)
        .attr('cx', d => getX(d.start_time))
        .attr('cy', 0);
    }

    function showMonth(month) {
      let diff = differenceInMonths(month, firstMonth);
      let offset = 0;
      if (diff < 0) {
        offset = diff;
      } else if (diff >= rowCount) {
        offset = diff - rowCount + 1;
      }
      if (offset) {
        lastScrollOffset = offset;
        firstMonth = addMonths(firstMonth, offset);
        renderMonths();
        renderActivities();
        renderCursor();
      }
    }

    function getX(date) {
      var week = differenceInCalendarWeeks(date, startOfMonth(date), {weekStartsOn: 1});
      return xMargin + 12 + (week * 10) + (getDate(date) - 1) * 22;
    }

    function getY(date) {
      let diff = differenceInMonths(startOfMonth(date), firstMonth);
      return yMargin + 20 + diff * 55;
    }

  }

  function monthString(date) {
    return format(date, 'YYYY-MM');
  }

})();
