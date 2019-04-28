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
    let rowCount = Math.max(1, options.rowCount || 4);
    let firstMonth = options.firstMonth || subMonths(startOfMonth(Date.now()), rowCount - 1);
    let onClick = options.onClick || (() => {});
    let getLabel = d => d.distance ? d.distance.toPrecision(2) : '';
    let svg = d3.select(`#${id}`)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%');
    svg.append('g').attr('class', 'month-layer');
    svg.append('g').attr('class', 'activity-layer');
    svg.append('g').attr('class', 'cursor-layer');

    renderMonths();

    return {
      setActivities,
      setActive
    };

    function setActivities(newActivities) {
      activities = newActivities;
      renderActivities();
    }

    function setActive(activity) {
      selected = activity;
      renderCursor();
      showMonth(startOfMonth(selected.start_time));
    }

    function renderMonths() {
      let months = Array.from(Array(rowCount).keys())
        .map(i => addMonths(firstMonth, i));
      let selection = svg.select('.month-layer').selectAll('.month')
        .data(months, d => format(d, 'YYYY-MM'));
      // exiting
      selection.exit()
        .remove();
      // updating
      selection
        .attr('transform', d => `translate(0,${getY(d)})`);
      // entering
      let entering = selection.enter()
        .append('g')
        .attr('class', 'month')
        .attr('transform', d => `translate(0,${getY(d)})`);
      entering.append('text')
        .attr('x', xMargin)
        .attr('y', -14)
        .text(d => format(d, 'MMMM YYYY'));
      entering.each(function(d) {
        let group = d3.select(this);
        let firstDay = startOfMonth(d);
        let lastDayOfMonth = endOfMonth(d);
        while (isSameMonth(firstDay, d)) {
          let lastDay = endOfWeek(firstDay, {weekStartsOn});
          if (lastDay > lastDayOfMonth) lastDay = lastDayOfMonth;
          group.append('line')
            .attr('x1', getX(firstDay) - 12)
            .attr('x2', getX(lastDay) + 12)
            .attr('y1', 0)
            .attr('y2', 0);
          firstDay = addDays(lastDay, 1);
        }
      });
    }

    function renderActivities() {
      let selection = svg.select('.activity-layer').selectAll('.activity')
        .data(activities, d => d.id);
      // exiting
      selection.exit()
        .remove();
      // updating
      selection
        .classed('selected', d => d.id === selected && selected.id)
        .attr('transform', d => `translate(${getX(d.start_time)},${getY(d.start_time)})`);
      // entering
      let entering = selection.enter()
        .append('g')
        .attr('class', 'activity')
        .attr('transform', d => `translate(${getX(d.start_time)},${getY(d.start_time)})`);
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
        .text(getLabel);
    }

    function renderCursor() {
      let selection = svg.select('.cursor-layer').selectAll('.cursor')
        .data(selected ? [selected] : [], d => d.id);
      // exiting
      selection.exit()
        .remove();
      // updating
      selection
        .attr('cx', d => getX(d.start_time))
        .attr('cy', d => getY(d.start_time));
      // entering
      selection.enter()
        .append('circle')
        .attr('class', 'cursor')
        .attr('r', 11)
        .attr('cx', d => getX(d.start_time))
        .attr('cy', d => getY(d.start_time));
    }

    function showMonth(month) {
      let diff = differenceInMonths(month, firstMonth);
      let correction = 0;
      if (diff < 0) {
        correction = diff;
      } else if (diff >= rowCount) {
        correction = diff - rowCount + 1;
      }
      if (correction) {
        firstMonth = addMonths(firstMonth, correction);
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

})();
