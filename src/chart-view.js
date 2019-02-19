/* global d3 */
(function() {

  window.runtopsy.ChartView = { create };

  function create(id) {
    let width = 700;
    let height = 85;
    let svg = d3.select(`#${id}`)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%');
    let x = d3.scaleLinear().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);
    var area = d3.area()
      .x(d => x(d.distance))
      .y0(height)
      .y1(d => y(d.speed));
    var line = d3.line()
      .x(d => x(d.distance))
      .y(d => y(d.speed));

    return {
      showActivity
    };

    function showActivity(activity) {
      let data = activity.records;
      x.domain(d3.extent(data, d => d.distance));
      y.domain([0, d3.max(data, d => d.speed)]);
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
