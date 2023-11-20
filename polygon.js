import {
  transition,
  line,
  dispatch,
} from 'd3';

import {
  createPolygonPoints,
  createPolygonEdges,
  getCodewordEdges,
} from './geometry';


/**
 * The order of the edges in e2 is as closely matched to e1 as much as possible
 * If there are at least 2 edge differences, the original e2 is returned
 * Otherwise, an ordered e2 is return
 * @param {Object[]} e1 The previous interior edges
 * @param {Object[]} e2 The current interior edges
 * @return {Object[]} All valid codewords for an N-polygon
 */
const positionEdges = (e1, e2) => {
  if (e1 == null || e1.length == 0) return e2

  let new_res = new Array(e1.length).fill(-1)
  let numbers = Array.from(Array(e1.length).keys())
  let unusedIndex = new Set(numbers)

  let idxDict = {}
  for (let i = 0; i < e1.length; i++) {
    let { start_idx, end_idx } = e1[i]
    let key = "" + start_idx + end_idx
    idxDict[key] = i
  }

  let count = 0
  let unused = null
  for (let j = 0; j < e2.length; j++) {
    let { start_idx, end_idx } = e2[j]
    let key = "" + start_idx + end_idx
    if (idxDict[key] == undefined) {
      unused = e2[j]
      count += 1
    } else if (idxDict[key] !== j) {
      new_res[idxDict[key]] = e2[j]
      unusedIndex.delete(idxDict[key])
    } else {
      new_res[j] = e2[j]
      unusedIndex.delete(j)
    }
  }

  if (count > 1) return e2

  let keys = unusedIndex.keys()
  let value = keys.next().value

  new_res[value] = unused

  return new_res
}

export const polygon = () => {
  let N;
  let codeword;
  let color;
  let pointColor;
  let radius;
  let pointSize;
  let margin;
  let transDuration;
  let strokeWidth;

  let drawDelay;

  let lastEdges;

  let interp;

  const listeners = dispatch('end');

  const my = (selection) => {
    let points = createPolygonPoints(N, radius, margin.left, margin.top);
    let polygonEdges = createPolygonEdges(points);
    let interiorEdges = getCodewordEdges(points, codeword);

    // NOTE: This code is very dangerous, refactor later
    if (lastEdges != null) {
      interiorEdges = positionEdges(lastEdges, interiorEdges)
    }

    lastEdges = interiorEdges
    const t = transition().duration(transDuration);
    const pointLine = line()
      .x((d) => d.x)
      .y((d) => d.y);

    const positionLines = (lines) => {
      lines
        .attr('x1', (d) => d.p1.x)
        .attr('y1', (d) => d.p1.y)
        .attr('x2', (d) => d.p2.x)
        .attr('y2', (d) => d.p2.y)
    };

    const initializeRadius = (circles) => {
      circles.attr('r', 0);
    };

    const growRadius = (enter) => {
      enter
        .transition(t)
        .attr('r', pointSize)
        .attr('fill', pointColor);
    };

    const positionCircles = (circles) => {
      circles
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
    };

    const positionText = (text) => {
      text
        .attr('x', (d) => d.x - 3 + d.ux * 15)
        .attr('y', (d) => d.y + 6 + d.uy * 15)
    };

    selection
      .selectAll('text')
      .data(points)
      .join(
        (enter) => {
          enter
            .append('text')
            .attr('font-size', '0px')
            .call(positionText)
            .transition(t)
            .attr('font-size', '16px')
            .text((_, i) => i);
        },

        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .call(positionText)
          ),
        (exit) =>
          exit
            .transition(t)
            .attr('font-size', '0px')
            .remove()
      )
      .transition(t)
      .attr('opacity', '1')
      .text((_, i) => i);

    selection
      .selectAll('circle')
      .data(points)
      .join(
        (enter) =>
          enter
            .append('circle')
            .call(positionCircles)
            .call(initializeRadius)
            .call(growRadius),
        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .call(positionCircles)
          ),
        (exit) =>
          exit
            .transition(t)
            .duration(1000)
            .call(initializeRadius)
            .remove()
      );

    selection
      .selectAll('line')
      .data(polygonEdges)
      .join(
        (enter) =>
          enter
            .append('line')
            .attr('stroke-opacity', '0.0')
            .transition(t)
            .attr('stroke-opacity', '1.0')
            .call(positionLines),
        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .call(positionLines)
          ),
        (exit) =>
          exit
            .transition(t)
            .attr('stroke-opacity', '0.0')
            .attr('x1', (_) => 0)
            .attr('y1', (_) => 0)
            .attr('x2', (_) => 0)
            .attr('y2', (_) => 0)
            .remove()
      )
      .attr('stroke', color)
      .attr('stroke-width', strokeWidth);

    selection
      .selectAll('path')
      .data(interiorEdges)
      .join(
        (enter) => {
          enter
            .append('path')
            .attr('class', 'interior')
            .attr('stroke-width', strokeWidth)
            .attr('d', (d) =>
              pointLine([d.p1, d.p2])
            )
            .attr(
              'stroke',
              (d) => interp((d.start_idx / interiorEdges.length))
            )
            .attr('opacity', '0')
            .transition()
            .delay((_, i) => i * drawDelay)
            .attr(
              'stroke-dasharray',
              (d) => d.dist + ' ' + d.dist
            )
            .attr(
              'stroke-dashoffset',
              (d) => d.dist
            )
            .transition()
            .attr('stroke-opacity', '1.0')
            .duration(1000)
            .attr('opacity', '1')            
            .on('end', (event) => {
              listeners.call('end', null);
            })
            .attr('stroke-dashoffset', 0);
        },

        (update) => {
          update.call((update) => {
            update
              .attr(
                'stroke-dasharray',
                null
              )
              .attr(
                'stroke-dashoffset',
                null
              )
              .transition(t)
              .attr(
                'stroke',
                (d) => interp((d.start_idx / interiorEdges.length))
              )
              .attr('d', (d) =>
                pointLine([d.p1, d.p2])
              )
          });
        },

        (exit) => {
          exit
            .transition(t)
            .attr('stroke-opacity', '0.0')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0)
            .remove();
        }
      );
  };

  my.codeword = function (_) {
    return arguments.length
      ? ((codeword = _), my)
      : codeword;
  };

  my.color = function (_) {
    return arguments.length
      ? ((color = _), my)
      : color;
  };

  my.radius = function (_) {
    return arguments.length
      ? ((radius = _), my)
      : radius;
  };

  my.pointSize = function (_) {
    return arguments.length
      ? ((pointSize = _), my)
      : pointSize;
  };

  my.pointColor = function (_) {
    return arguments.length
      ? ((pointColor = _), my)
      : pointColor;
  };

  my.N = function (_) {
    this.reset()
    return arguments.length ? (
      (N = _), my) : N;
  };

  my.reset = function() {
    lastEdges = null;
    codeword = []
    return my;
  }

  my.margin = function (_) {
    return arguments.length
      ? ((margin = _), my)
      : margin;
  };

  my.strokeWidth = function (_) {
    return arguments.length
      ? ((strokeWidth = _), my)
      : strokeWidth;
  };


  my.interp = function (_) {
    return arguments.length
      ? ((interp = _), my)
      : interp;
  };

  my.drawDelay = function (_) {
    return arguments.length
      ? ((drawDelay = _), my)
      : drawDelay;
  };

  my.transDuration = function (_) {
    return arguments.length
      ? ((transDuration = _), my)
      : transDuration;
  };

  my.on = function () {
    var value = listeners.on.apply(
      listeners,
      arguments
    );
    return value === listeners ? my : value;
  };

  return my;
};
