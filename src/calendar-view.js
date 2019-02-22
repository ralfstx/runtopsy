/* global d3 */
(function() {

  const { addDays, addMonths, differenceInMonths, endOfMonth, endOfWeek, format, getDate, isSameMonth, startOfMonth, subMonths } = window.dateFns;

  window.runtopsy.CalendarView = {
    create
  };

  const weekStartsOn = 1;

  function create(id, options = {}) {

    let rowCount = Math.max(1, options.rowCount || 4);
    let firstMonth = options.firstMonth || subMonths(startOfMonth(Date.now()), rowCount - 1);
    let onClick = options.onClick || (() => {});
    let svg = d3.select(`#${id}`)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%');

    renderMonths();

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
        .attr('x', 5)
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
            .attr('x1', getX(firstDay) - 7)
            .attr('x2', getX(lastDay) + 7)
            .attr('y1', 0)
            .attr('y2', 0);
          firstDay = addDays(lastDay, 1);
        }
      });
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
    }

    function getX(date) {
      return 10 + (getDate(date) - 1) * 22;
    }

    function getY(date) {
      let diff = differenceInMonths(startOfMonth(date), firstMonth);
      return 40 + diff * 50;
    }

  }

})();
