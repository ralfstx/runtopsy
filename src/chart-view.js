/* global d3 */
(function() {

  const scaleHeight = 20;
  const xMargin = 10;

  window.runtopsy.ChartView = { create };

  function create(id, options = {}) {
    let container = document.getElementById(id);
    let onHover = options.onHover || (() => {});
    let xSelector = record => record.distance / 1000;
    let ySelector = record => record.speed * 3.6;
    let svg = d3.select(container)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .on('mousemove', () => onMouseOver())
      .on('mouseout', () => onMouseOut());
    let xScale = d3.scaleLinear();
    let yScale = d3.scaleLinear();
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
      xScale.range([xMargin, width - xMargin]);
      yScale.range([height - scaleHeight, 0]);
      svg.selectAll('.line').remove();
      svg.selectAll('.area').remove();
      svg.selectAll('.cursor').remove();
      svg.selectAll('.scale').remove();
      if (!data.length) return;
      let area = d3.area()
        .x(d => xScale(xSelector(d)))
        .y0(yScale(0))
        .y1(d => yScale(ySelector(d)));
      let line = d3.line()
        .x(d => xScale(xSelector(d)))
        .y(d => yScale(ySelector(d)));
      xScale.domain(d3.extent(data, xSelector));
      yScale.domain([0, d3.max(data, ySelector)]);
      let xMax = Math.floor(d3.max(data, xSelector));
      let ticks = Array.from(new Array(xMax + 1)).map((el, i) => i);
      let xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format('d')).tickValues(ticks);
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
        .attr('class', 'cursor hidden')
        .attr('y1', 0)
        .attr('y2', height - scaleHeight)
        .attr('pointer-events', 'none');
      svg.append('g')
        .attr('class', 'scale')
        .attr('transform', `translate(0,${height - scaleHeight})`)
        .call(xAxis);
    }

    function onMouseOver() {
      if (!currentActivity) return;
      let x = d3.event.pageX - container.getBoundingClientRect().x;
      let record = getRecordByValue(x, xSelector) || null;
      let recordX = record ? xScale(xSelector(record)) : 0;
      svg.select('.cursor')
        .classed('hidden', !record)
        .attr('x1', recordX)
        .attr('x2', recordX);
      onHover(record);
    }

    function onMouseOut() {
      svg.select('.cursor')
        .classed('hidden', true);
      onHover(null);
    }

    function getRecordByValue(x, selector) {
      let value = xScale.invert(x);
      let records = currentActivity.records;
      for (let record of records) {
        if (selector(record) >= value) {
          return record;
        }
      }
      return records[records.length - 1];
    }

  }

})();
