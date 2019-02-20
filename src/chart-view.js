/* global d3 */
(function() {

  window.runtopsy.ChartView = { create };

  function create(id, options = {}) {
    let container = document.getElementById(id);
    let onHover = options.onHover || (() => {});
    let svg = d3.select(container)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .on('mousemove', () => onMouseOver())
      .on('mouseout', () => onMouseOut());
    let xRange = d3.scaleLinear();
    let yRange = d3.scaleLinear();
    let currentActivity;
    window.addEventListener('resize', () => showActivity());

    return {
      showActivity
    };

    function showActivity(activity = currentActivity) {
      if (!activity) return;
      currentActivity = activity;
      let data = activity.records;
      let width = container.clientWidth;
      let height = container.clientHeight;
      xRange.range([0, width]);
      yRange.range([height, 0]);
      let area = d3.area()
        .x(d => xRange(d.distance))
        .y0(height)
        .y1(d => yRange(d.speed));
      let line = d3.line()
        .x(d => xRange(d.distance))
        .y(d => yRange(d.speed));
      xRange.domain(d3.extent(data, d => d.distance));
      yRange.domain([0, d3.max(data, d => d.speed)]);
      svg.selectAll('.line').remove();
      svg.selectAll('.area').remove();
      svg.selectAll('.cursor').remove();
      svg.append('path')
        .data([data])
        .attr('class', 'area')
        .attr('d', area)
        .attr('pointer-events', 'none');
      svg.append('path')
        .data([data])
        .attr('class', 'line')
        .attr('d', line)
        .attr('pointer-events', 'none');
      svg.append('line')
        .attr('class', 'cursor')
        .attr('x1', xRange(0))
        .attr('x2', xRange(0))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('pointer-events', 'none');
    }

    function onMouseOver() {
      if (!currentActivity) return;
      let x = d3.event.pageX - container.getBoundingClientRect().x;
      svg.select('.cursor')
        .attr('x1', x)
        .attr('x2', x)
        .attr('opacity', 1);
      onHover(getRecordByDistance(x) || null);
    }

    function onMouseOut() {
      svg.select('.cursor')
        .attr('opacity', 0);
      onHover(null);
    }

    function getRecordByDistance(x) {
      let distance = xRange.invert(x);
      for (let record of currentActivity.records) {
        if (record.distance >= distance) {
          return record;
        }
      }
    }
  }

})();
