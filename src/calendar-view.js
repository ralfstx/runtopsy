/* global d3 */
(function() {

  // @ts-ignore
  const { DateTime, Interval } = window.luxon;

  // @ts-ignore
  window.runtopsy.CalendarView = {
    create
  };

  function create(id, options = {}) {

    let rowCount = Math.max(1, options.rowCount || 5);
    let firstMonth = options.firstMonth || DateTime.local().startOf('month').minus({months: rowCount - 1});
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
      let data = [];
      for (let i = 0; i < rowCount; i++) {
        data.push(firstMonth.plus({months: i}));
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

    function showActivities(activities) {
      let selection = svg.selectAll('.activity').data(activities, d => d.id);
      // exiting
      selection.exit()
        .remove();
      // updating
      selection
        .transition().duration(500)
        .attr('cy', d => getY(DateTime.fromISO(d.start)));
      // entering
      selection.enter()
        .append('circle')
        .attr('class', 'activity')
        .attr('r', 7)
        .attr('cx', d => getX(DateTime.fromISO(d.start)))
        .attr('cy', d => getY(DateTime.fromISO(d.start)))
        .on('click', d => onClick(d));
    }

    function setActive(activity) {
      svg.selectAll('.activity')
        .classed('selected', d => d.id === activity.id)
        .attr('r', d => d.id === activity.id ? 8 : 7);
    }

    function getX(dateTime) {
      return 10 + (dateTime.day - 1) * 22;
    }

    function getY(dateTime) {
      let diff = Interval.fromDateTimes(firstMonth, dateTime.startOf('month')).length('months');
      return 40 + diff * 50;
    }

  }

})();
