/* global d3 */
(function() {

  window.runtopsy.ChartView = { create };

  function create(id) {
    let container = document.getElementById(id);
    let svg = d3.select(container)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%');
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
      svg.append('path')
        .data([data])
        .attr('class', 'area')
        .attr('d', area);
      svg.append('path')
        .data([data])
        .attr('class', 'line')
        .attr('d', line);
    }

  }

})();
