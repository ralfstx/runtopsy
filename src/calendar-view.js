/* global d3 */
(function() {

  const { addDays, addMonths, differenceInCalendarWeeks, differenceInMonths, endOfMonth, endOfWeek, format, getDate,
    isSameMonth, startOfMonth, subMonths } = window.dateFns;
  const weekStartsOn = 1;
  const xMargin = 20;
  const yMargin = 20;

  window.runtopsy.CalendarView = { create };

  function create(id, options = {}) {

    let rowCount = Math.max(1, options.rowCount || 4);
    let firstMonth = options.firstMonth || subMonths(startOfMonth(Date.now()), rowCount - 1);
    let onClick = options.onClick || (() => {});
    let svg = d3.select(`#${id}`)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%');

    renderMonths();
    createCursor();

    return {
      showActivities,
      setActive
    };

    function renderMonths() {
      let data = Array.from(Array(rowCount).keys())
        .map(i => addMonths(firstMonth, i));
      let selection = svg.selectAll('.month')
        .data(data, d => format(d, 'YYYY-MM'));
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
        .attr('x', xMargin + 7)
        .attr('y', -16)
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

    function createCursor() {
      svg.append('circle')
        .attr('class', 'cursor')
        .classed('hidden', true)
        .attr('r', 13);
    }

    function showActivities(activities) {
      let selection = svg.selectAll('.activity').data(activities, d => d.id);
      // exiting
      selection.exit()
        .remove();
      // updating
      selection
        .transition().duration(500)
        .attr('cy', d => getY(d.start));
      // entering
      selection.enter()
        .append('circle')
        .attr('class', d => 'activity ' + d.type)
        .attr('r', 7)
        .attr('cx', d => getX(d.start))
        .attr('cy', d => getY(d.start))
        .on('click', d => onClick(d));
    }

    function setActive(activity) {
      svg.selectAll('.activity')
        .classed('selected', d => d.id === activity.id)
        .attr('r', d => d.id === activity.id ? 8 : 7);
      svg.select('.cursor')
        .classed('hidden', false)
        .attr('cx', getX(activity.start))
        .attr('cy', getY(activity.start));
    }

    function getX(date) {
      var week = differenceInCalendarWeeks(date, startOfMonth(date), {weekStartsOn: 1});
      return xMargin + 12 + (week * 10) + (getDate(date) - 1) * 22;
    }

    function getY(date) {
      let diff = differenceInMonths(startOfMonth(date), firstMonth);
      return yMargin + 20 + diff * 50;
    }

  }

})();
