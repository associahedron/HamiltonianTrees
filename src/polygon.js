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
  // console.log(JSON.stringify(e1.map(d => ("" + d.start_idx + d.end_idx))), "PREVIOUS")

  // console.log(JSON.stringify(e2.map(d => ("" + d.start_idx + d.end_idx))), "CURRENT")

  // 20020, 10120
  // 2010, 1020


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
  let dash;
  let fontSize;

  let drawDelay;

  let lastEdges;

  let interp;
  let treeInterp;

  let nodes;
  let treePath = [];

  const listeners = dispatch("animstart", "animend");

  const my = (selection) => {
    let points = createPolygonPoints(N, radius, margin.left, margin.top);
    let polygonEdges = createPolygonEdges(points);
    let interiorEdges = getCodewordEdges(points, codeword);

    // NOTE: This code is very dangerous, refactor later
    if (lastEdges != null) {
      interiorEdges = positionEdges(lastEdges, interiorEdges);
    }

    treePath = []

    let triangles = []

    let maxDepth = 1;
    if (interiorEdges) {
      let treeInfo = createTriangles(codeword, polygonEdges, interiorEdges, points);
      treePath = treeInfo.solution;
      maxDepth = treeInfo.maxDepth;
      nodes = treeInfo.nodes
      triangles = Object.values(treeInfo.triangles)
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
        .attr("x", (_, i) => points[i].x - 3 + points[i].ux * 15)
        .attr("y", (_, i) => points[i].y + 6 + points[i].uy * 15);
    };

    const calculateDashArr = (edge) => {
      let dashLength = dash
        .split(/[\s,]/)
        .map((a) => parseFloat(a) || 0)
        .reduce((a, b) => a + b);

      let dashCount = Math.ceil(edge.dist / dashLength);
      let newDashes = new Array(dashCount).join(dash + " ");
      let dashArray = newDashes + " 0, " + edge.dist;
      return dashArray;
    };

    const exitLines = (lines) => {
      lines
        .attr("x1", (_) => 0)
        .attr("y1", (_) => 0)
        .attr("x2", (_) => 0)
        .attr("y2", (_) => 0)
    }

    selection
      .selectAll(".vertex-label")
      .data(codeword)
      .join(
        (enter) => {
          enter
            .append("text")
            .attr("class", "vertex-label")
            .attr("opacity", "0.0")
            .attr("font-size", fontSize)
            .call(positionText)
            .transition(t)

            .attr("opacity", "1.0")
            .text((d) => d)
             
            // });
        },

        (update) =>
          update.call((update) => update
          // .attr("opacity", "0.0")
          .transition(t)
          // .attr("font-size", fontSize)
          // .attr("opacity", "1.0")
          .text((d) => d)
          .call(positionText)),
        (exit) => exit
          .transition(t)
          .attr("opacity", "0.0")
          .remove()
      )
      // .attr("opacity", "0.0")
      // .transition(t)
      // .attr("opacity", "1.0")
      // .text((d, i) => {
      //   if (codeword[i] != null) {
      //     return codeword[i].toString()
      //   }            
      // })

    selection
      .select("#poly-nodes")
      .selectAll(".edge-node")
      .data(polygonEdges.map((e) => e.midpoint ).slice(0, -1))
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "edge-node")
            .call(enterCircles, interp(7 / 11)),

        (update) =>
          update.call((update) => update.transition(t).call(positionCircles)),
        (exit) => exit.transition(t).call(initializeRadius).remove()
      );
  
    selection
      .select("#poly-nodes")
      .selectAll(".root")
      .data(polygonEdges.map((e) => e.midpoint ).slice(-1))
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "root")
            .call(enterCircles, "black"),

        (update) =>
          update.call((update) => update.transition(t).call(positionCircles)),
        (exit) => exit.transition(t).call(initializeRadius).remove()
      );

    selection
      .select("#poly-nodes")
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
      .select("#poly-links")
      .selectAll(".polygon-lines")
      .data(polygonEdges)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("class", "polygon-lines")
            .attr("stroke-opacity", "0.0")
            .transition(t)
            .on("start", () => { listeners.call("animstart", null);  })
            .on("end", () => {
              listeners.call("animend", null);
            })
            .attr("stroke-opacity", "1.0")
            .call(positionLines),
        (update) =>
          update.call((update) => update.transition(t).call(positionLines)),
        (exit) =>
          exit
            .transition(t)
            .on("start", () => { listeners.call("animstart", null) })
            .on("end", () => {
              listeners.call("animend", null);
            })
            .attr("stroke-opacity", "0.0")
            .call(exitLines)
            .remove()
      )
      .attr("stroke", color)
      .attr("stroke-width", strokeWidth);

    selection
      .select("#poly-interior-links")
      .selectAll(".tree-path")
      .data(treePath)
      .join(
        (enter) => {
          enter
            .append("path")
            .attr("class", "tree-path")
            .attr("stroke-width", strokeWidth)
            .attr("d", (d) => pointLine([d.p1, d.p2]))
            .attr("stroke", (d) => treeInterp(1 - (d.depth / 11))) // 11 is the max N
            .attr("opacity", "0.0")
            .transition()
            .delay(
              (d, _) => interiorEdges.length * drawDelay + d.depth * drawDelay
            )
            // .on("end", (event) => {
            //   listeners.call("interioredgedraw", null);
            // })
            .attr("stroke-dasharray", (d) => calculateDashArr(d))
            .attr("stroke-dashoffset", (d) => d.dist)
            .transition()

            .attr("stroke-opacity", "1.0")
            .duration(1000)
            .attr("opacity", "1")
            .attr("stroke-dashoffset", 0)
            .end()
            .then(() => {
              listeners.call("animend", null);
              // finishedAnimating = true
            })
            // .catch(() => {
            //   listeners.call("animend", null);
            // })
        },

        (update) => {
          update.call((update) => {
            update
              .attr("stroke-dasharray", dash)
              .attr("stroke-dashoffset", null)
              .transition(t)
              .attr("stroke", (d) => treeInterp(1-(d.depth / 11)))
              .attr("d", (d) => pointLine([d.p1, d.p2]));
          });
        },

        (exit) => {
          exit
            .transition(t)
            .attr("stroke-opacity", "0.0")
            .call(exitLines)
            .remove();
        }
      );

    selection
      .select("#poly-links")
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
            .attr("opacity", "0.0")
            .transition()
            .on("start", () => { listeners.call("animstart", null) })
            .delay((_, i) => i * drawDelay)
            // .on("end", (_) => {
            //   console.log("draw edge")
              // listeners.call("end", null);
            // })
            .attr("stroke-dasharray", (d) => d.dist + " " + d.dist)
            .attr("stroke-dashoffset", (d) => d.dist)
            .transition()
            .attr("stroke-opacity", "1.0")
            .duration(1000)
            .attr("opacity", "1")
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
            .call(exitLines)
            .remove();
        }
      );

    // TODO
    selection
      .selectAll(".interiorVertex")
      .data(
        triangles.map((tri) => ({
          x: tri.getCentroid().x,
          y: tri.getCentroid().y,
          start_idx: 0,
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
            .attr("fill", (d) => interp(3 / 11)),
        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .call(positionCircles)
              .attr("fill", (d) => interp(3/ 11))
          ),
        (exit) => exit.transition(t).call(initializeRadius).remove()
      );
    // selection
    //   .selectAll(".interiorVertex")
    //   .data(
    //     interiorEdges.map((e) => ({
    //       x: e.midpoint.x,
    //       y: e.midpoint.y,
    //       start_idx: e.start_idx,
    //     }))
    //   )
    //   .join(
    //     (enter) =>
    //       enter
    //         .append("circle")
    //         .attr("class", "interiorVertex")
    //         .transition()
    //         .delay((_, i) => i * drawDelay)
    //         .call(positionCircles)
    //         .call(initializeRadius)
    //         .transition(t)
    //         .attr("r", pointSize)
    //         .attr("fill", (d) => interp(d.start_idx / interiorEdges.length)),
    //     (update) =>
    //       update.call((update) =>
    //         update
    //           .transition(t)
    //           .call(positionCircles)
    //           .attr("fill", (d) => interp(d.start_idx / interiorEdges.length))
    //       ),
    //     (exit) => exit.transition(t).call(initializeRadius).remove()
    //   );
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

  my.dash = function (_) {
    return arguments.length ? ((dash = _), my) : dash;
  };

  my.fontSize = function (_) {
    return arguments.length ? ((fontSize = _), my) : fontSize;
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

  my.nodes = function() {
    if (nodes) {
      return nodes
    } else {
      return []
    }
  }

  my.treePath = function() {
    return treePath
  }


  return my;
};
