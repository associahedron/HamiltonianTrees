import { transition, line, dispatch } from "d3";

import {
  createPolygonPoints,
  createPolygonEdges,
  getCodewordEdges,
  createTriangles,
} from "./geometry";

/**
 * The order of the edges in e2 is as closely matched to e1 as much as possible
 * If there are at least 2 edge differences, the original e2 is returned
 * Otherwise, an ordered e2 is return
 * @param {Object[]} e1 The previous interior edges
 * @param {Object[]} e2 The current interior edges
 * @return {Object[]} All valid codewords for an N-polygon
 */
const positionEdges = (e1, e2) => {
  if (e1 == null || e1.length == 0) return e2;

  let new_res = new Array(e1.length).fill(-1);
  let numbers = Array.from(Array(e1.length).keys());
  let unusedIndex = new Set(numbers);

  let idxDict = {};
  for (let i = 0; i < e1.length; i++) {
    let { start_idx, end_idx } = e1[i];
    let key = "" + start_idx + end_idx;
    idxDict[key] = i;
  }

  let count = 0;
  let unused = null;
  for (let j = 0; j < e2.length; j++) {
    let { start_idx, end_idx } = e2[j];
    let key = "" + start_idx + end_idx;
    if (idxDict[key] == undefined) {
      unused = e2[j];
      count += 1;
    } else if (idxDict[key] !== j) {
      new_res[idxDict[key]] = e2[j];
      unusedIndex.delete(idxDict[key]);
    } else {
      new_res[j] = e2[j];
      unusedIndex.delete(j);
    }
  }

  if (count > 1) return e2;

  let keys = unusedIndex.keys();
  let value = keys.next().value;

  new_res[value] = unused;

  return new_res;
};

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
  let treeInterp;

  const listeners = dispatch("end");

  const my = (selection) => {
    let points = createPolygonPoints(N, radius, margin.left, margin.top);
    let polygonEdges = createPolygonEdges(points);
    let interiorEdges = getCodewordEdges(points, codeword);

    // NOTE: This code is very dangerous, refactor later
    if (lastEdges != null) {
      interiorEdges = positionEdges(lastEdges, interiorEdges);
    }

    let treePath = [];
    let maxDepth = 1;
    if (interiorEdges) {
      let treeInfo = createTriangles(codeword, polygonEdges, interiorEdges);
      treePath = treeInfo.solution;
      maxDepth = treeInfo.maxDepth;
    }

    lastEdges = interiorEdges;
    const t = transition().duration(transDuration);
    const pointLine = line()
      .x((d) => d.x)
      .y((d) => d.y);

    const positionLines = (lines) => {
      lines
        .attr("x1", (d) => d.p1.x)
        .attr("y1", (d) => d.p1.y)
        .attr("x2", (d) => d.p2.x)
        .attr("y2", (d) => d.p2.y);
    };

    // const positionMidpoint = (lines) => {
    //   lines
    //     .attr('x1', (d) => d.p1.x)
    //     .attr('y1', (d) => d.p1.y)
    //     .attr('x2', (d) => d.p2.x)
    //     .attr('y2', (d) => d.p2.y)
    // };

    const initializeRadius = (circles) => {
      circles.attr("r", 0);
    };

    const growRadius = (enter, color) => {
      enter.transition(t).attr("r", pointSize).attr("fill", color);
    };

    const positionCircles = (circles) => {
      circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    };

    const enterCircles = (circles, color) => {
      circles
        .call(positionCircles)
        .call(initializeRadius)
        .call(growRadius, color);
    };

    const positionText = (text) => {
      text
        .attr("x", (d) => d.x - 3 + d.ux * 15)
        .attr("y", (d) => d.y + 6 + d.uy * 15);
    };

    selection
      .selectAll("text")
      .data(points)
      .join(
        (enter) => {
          enter
            .append("text")
            .attr("font-size", "0px")
            .call(positionText)
            .transition(t)
            .attr("font-size", "16px")
            .text((_, i) => i);
        },

        (update) =>
          update.call((update) => update.transition(t).call(positionText)),
        (exit) => exit.transition(t).attr("font-size", "0px").remove()
      )
      .transition(t)
      .attr("opacity", "1")
      .text((_, i) => i);

    selection
      .selectAll(".root")
      .data([polygonEdges[polygonEdges.length - 1].midpoint])
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "root")
            .call(enterCircles, interp(0)),

        (update) =>
          update.call((update) => update.transition(t).call(positionCircles)),
        (exit) => exit.transition(t).call(initializeRadius).remove()
      );

    selection
      .selectAll(".vertex")
      .data(points)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "vertex")
            .call(enterCircles, pointColor),
        (update) =>
          update.call((update) => update.transition(t).call(positionCircles)),
        (exit) => exit.transition(t).call(initializeRadius).remove()
      );

    selection
      .selectAll(".polygon-lines")
      .data(polygonEdges)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("class", "polygon-lines")
            .attr("stroke-opacity", "0.0")
            .transition(t)
            .attr("stroke-opacity", "1.0")
            .call(positionLines),
        (update) =>
          update.call((update) => update.transition(t).call(positionLines)),
        (exit) =>
          exit
            .transition(t)
            .attr("stroke-opacity", "0.0")
            .attr("x1", (_) => 0)
            .attr("y1", (_) => 0)
            .attr("x2", (_) => 0)
            .attr("y2", (_) => 0)
            .remove()
      )
      .attr("stroke", color)
      .attr("stroke-width", strokeWidth);

    selection
      .selectAll(".tree-path")
      .data(treePath)
      .join(
        (enter) => {
          enter
            .append("path")
            .attr("class", "tree-path")
            .attr("stroke-width", strokeWidth)
            .attr("d", (d) => pointLine([d.p1, d.p2]))
            .attr("stroke", (d) => treeInterp(d.depth / maxDepth))
            .attr("opacity", "0")
            .transition()
            .delay((_, i) => i * drawDelay)
            .attr("stroke-dasharray", (d) => {
              // NOTE: THIS IMPLEMENTATION IS FROM https://www.visualcinnamon.com/2016/01/animating-dashed-line-d3/
              //Create a (random) dash pattern
              //The first number specifies the length of the visible part, the dash
              //The second number specifies the length of the invisible part
              var dashing = "6, 6";

              //This returns the length of adding all of the numbers in dashing
              //(the length of one pattern in essence)
              //So for "6,6", for example, that would return 6+6 = 12
              var dashLength = dashing
                .split(/[\s,]/)
                .map(function (a) {
                  return parseFloat(a) || 0;
                })
                .reduce(function (a, b) {
                  return a + b;
                });

              //How many of these dash patterns will fit inside the entire path?
              var dashCount = Math.ceil(d.dist / dashLength);

              //Create an array that holds the pattern as often
              //so it will fill the entire path
              var newDashes = new Array(dashCount).join(dashing + " ");
              //Then add one more dash pattern, namely with a visible part
              //of length 0 (so nothing) and a white part
              //that is the same length as the entire path
              var dashArray = newDashes + " 0, " + d.dist;
              return dashArray;
            })
            .attr("stroke-dashoffset", (d) => d.dist)
            .transition()
            .attr("stroke-opacity", "1.0")
            .duration(1000)
            .attr("opacity", "1")
            .on("end", (event) => {
              listeners.call("end", null);
            })
            .attr("stroke-dashoffset", 0);
        },

        (update) => {
          update.call((update) => {
            update
              .attr("stroke-dasharray", "6, 6")
              .attr("stroke-dashoffset", null)
              .transition(t)
              .attr("stroke", (d) => treeInterp(d.depth / maxDepth))
              .attr("d", (d) => pointLine([d.p1, d.p2]));
          });
        },

        (exit) => {
          exit
            .transition(t)
            .attr("stroke-opacity", "0.0")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0)
            .remove();
        }
      );

    selection
      .selectAll(".interior")
      .data(interiorEdges)
      .join(
        (enter) => {
          enter
            .append("path")
            .attr("class", "interior")
            .attr("stroke-width", strokeWidth)
            .attr("d", (d) => pointLine([d.p1, d.p2]))
            .attr("stroke", (d) => interp(d.start_idx / interiorEdges.length))
            .attr("opacity", "0")
            .transition()
            .delay((_, i) => i * drawDelay)
            .attr("stroke-dasharray", (d) => d.dist + " " + d.dist)
            .attr("stroke-dashoffset", (d) => d.dist)
            .transition()
            .attr("stroke-opacity", "1.0")
            .duration(1000)
            .attr("opacity", "1")
            .on("end", (event) => {
              listeners.call("end", null);
            })
            .attr("stroke-dashoffset", 0);
        },

        (update) => {
          update.call((update) => {
            update
              .attr("stroke-dasharray", null)
              .attr("stroke-dashoffset", null)
              .transition(t)
              .attr("stroke", (d) => interp(d.start_idx / interiorEdges.length))
              .attr("d", (d) => pointLine([d.p1, d.p2]));
          });
        },

        (exit) => {
          exit
            .transition(t)
            .attr("stroke-opacity", "0.0")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0)
            .remove();
        }
      );

    selection
      .selectAll(".interiorVertex")
      .data(
        interiorEdges.map((e) => ({
          x: e.midpoint.x,
          y: e.midpoint.y,
          start_idx: e.start_idx,
        }))
      )
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "interiorVertex")
            .transition()
            .delay((_, i) => i * drawDelay)
            .call(positionCircles)
            .call(initializeRadius)
            .transition(t)
            .attr("r", pointSize)
            // .call(enterCircles, "black")
            .attr("fill", (d) => interp(d.start_idx / interiorEdges.length)),
        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .call(positionCircles)
              .attr("fill", (d) => {
                console.log(d);
                return interp(d.start_idx / interiorEdges.length);
              })
          ),
        (exit) => exit.transition(t).call(initializeRadius).remove()
      );
  };

  my.codeword = function (_) {
    return arguments.length ? ((codeword = _), my) : codeword;
  };

  my.color = function (_) {
    return arguments.length ? ((color = _), my) : color;
  };

  my.radius = function (_) {
    return arguments.length ? ((radius = _), my) : radius;
  };

  my.pointSize = function (_) {
    return arguments.length ? ((pointSize = _), my) : pointSize;
  };

  my.pointColor = function (_) {
    return arguments.length ? ((pointColor = _), my) : pointColor;
  };

  my.N = function (_) {
    this.reset();
    return arguments.length ? ((N = _), my) : N;
  };

  my.reset = function () {
    lastEdges = null;
    codeword = [];
    return my;
  };

  my.margin = function (_) {
    return arguments.length ? ((margin = _), my) : margin;
  };

  my.strokeWidth = function (_) {
    return arguments.length ? ((strokeWidth = _), my) : strokeWidth;
  };

  my.interp = function (_) {
    return arguments.length ? ((interp = _), my) : interp;
  };

  my.treeInterp = function (_) {
    return arguments.length ? ((treeInterp = _), my) : treeInterp;
  };

  my.drawDelay = function (_) {
    return arguments.length ? ((drawDelay = _), my) : drawDelay;
  };

  my.transDuration = function (_) {
    return arguments.length ? ((transDuration = _), my) : transDuration;
  };

  my.on = function () {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? my : value;
  };

  return my;
};
