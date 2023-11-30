(function (d3$1) {
  'use strict';

  /**
   * @param {number} n  N-polygon sides
   * @return {number[][]} All valid codewords for an N-polygon
   */
  function getCodeWords(n) {
    var UP = 0;
    var DOWN = 1;

    var codeword = new Array(n).fill(-1);
    var direction = new Array(n).fill(-1);
    var pushPoint = new Array(n).fill(-1);
    var maxValue = new Array(n).fill(-1);
    var codeWordList = [];

    function initialize() {
      codeword[0] = n - 1;
      for (var j = 1; j < n; j++) {
        codeword[j] = 0;
        pushPoint[j] = 0;
      }
      codeWordList.push([].concat( codeword ));
    }

    function generate_all_trees(position) {
      if (position === 0) {
        return;
      }

      if (position === n - 1) {
        maxValue[position] = 1;
      } else if (position !== 0) {
        maxValue[position] =
          maxValue[position + 1] +
          1 -
          codeword[position + 1];
      }

      if (codeword[position] == 0) {
        direction[position] = UP;
      } else {
        direction[position] = DOWN;
      }

      generate_all_trees(position - 1);

      for (var i = 0; i < maxValue[position]; i++) {
        if (direction[position] == UP) {
          pull(position, pushPoint[position]);
        } else {
          push(position, pushPoint[position]);
        }
        generate_all_trees(position - 1);
      }

      if (position !== n - 1) {
        if (direction[position] == UP) {
          pushPoint[position + 1] = position;
        } else {
          pushPoint[position + 1] =
            pushPoint[position];
        }
      }
    }

    function push(i, j) {
      codeword[i] = codeword[i] - 1;
      codeword[j] = codeword[j] + 1;
      codeWordList.push([].concat( codeword ));
    }

    function pull(i, j) {
      codeword[i] = codeword[i] + 1;
      codeword[j] = codeword[j] - 1;
      codeWordList.push([].concat( codeword ));
    }

    initialize();
    generate_all_trees(n - 1);

    return codeWordList;
  }

  var createEdge = function (p1, p2, start, end, depth) {
    if ( depth === void 0 ) depth = -1;

    var x = (p1.x + p2.x) / 2;
    var y = (p1.y + p2.y) / 2;
    var x_diff = p1.x - p2.x;
    var y_diff = p1.y - p2.y;
    var dist = Math.hypot(x_diff, y_diff);
    return {
      p1: p1,
      p2: p2,
      midpoint: { x: x, y: y },
      dist: dist,
      start_idx: start,
      end_idx: end,
      getKey: function () { return (start + "," + end); },
      depth: depth,
    };
  };

  var createPolygonPoints = function (N, r, leftOffset, topOffset) {
    var points = [];
    var inc = (2 * Math.PI) / N;
    for (var i = 0; i < N; i++) {
      var theta = inc * (i + 1) + (Math.PI * 3) / 2 - inc / 2;

      var r_x = r + leftOffset;
      var r_y = r + topOffset;

      var x = r * Math.cos(theta) + r_x;
      var y = r * Math.sin(theta) + r_y;

      var vec_x = x - r_x;
      var vec_y = y - r_y;
      var mag = Math.sqrt(vec_x * vec_x + vec_y * vec_y);
      var ux = vec_x / mag;
      var uy = vec_y / mag;

      var point = { x: x, y: y, ux: ux, uy: uy };
      points.push(point);
    }
    points.reverse();
    return points;
  };

  var createPolygonEdges = function (points) {
    var edges = [];
    var N = points.length;
    for (var i = 0; i < N; i++) {
      var curr_point = points[i];

      var next_point_idx = (i + 1) % N;
      var next_point = points[next_point_idx];
      var edge = createEdge(curr_point, next_point, i, next_point_idx);
      edges.push(edge);
    }
    return edges;
  };

  var createTriangles = function (codeword, polygonEdges, interiorEdges) {
    if (!interiorEdges.length) { return { solution: [], maxDepth: 1 }; }

    var interiorMap = {};

    var N = polygonEdges.length;
    var interiorN = interiorEdges.length;

    var rootKey = (N - 1) + ",0";

    for (var i = 0; i < interiorN; i++) {
      var edge = interiorEdges[i];
      var key = edge.getKey();
      interiorMap[key] = edge;
    }
    interiorMap[rootKey] = polygonEdges[N - 1];

    var formatKey = function (start, end) {
      return (start + "," + end)
    };
    var getWrapIndex = function (idx) { return idx % N; };
    var fillCrossings = function (crossings, start, end) {
      for (var i = start + 1; i < end; i++) {
        crossings[getWrapIndex(i)] = true;
      }
    };

    var nodes = {};

    var crossings = new Array(N).fill(false);
    var polyEdgesUsed = new Array(N).fill(false);
    var used = new Set(d3$1.range(N));

    var edgeStack = [];
    var startIndex = codeword.length - 1;
    for (var i$1 = startIndex; i$1 >= 0; i$1--) {
      var point = i$1;
      var code = codeword[i$1];

      var edgePoint = point + 2;
      while (code > 0) {
        var ind = getWrapIndex(edgePoint);
        // If there are no crossing at the index, then it's a valid edge
        if (!crossings[ind]) {
          var tri = [];
          tri.push([point, ind]);
          code--;
          fillCrossings(crossings, point, edgePoint);

          var node = {};
          node.left = null;
          node.right = null;
          node.parent = null;
          node.depth = 0;
          var key$1 = formatKey(point, ind);
          node.value = key$1;
          nodes[key$1] = node;

          var checkRange = d3$1.range(point, edgePoint).map(function (e) { return getWrapIndex(e); });
          for (var j = 0; j < checkRange.length; j++) {
            var edge$1 = checkRange[j];
            if (!polyEdgesUsed[edge$1]) {
              polyEdgesUsed[edge$1] = true;
              tri.push([edge$1, getWrapIndex(edge$1 + 1)]);
              used.delete(edge$1);
            }
          }

          while (tri.length < 3) {
            var e = edgeStack.pop();
            var childKey = formatKey(e[0], e[1]);
            var parentKey = formatKey(point, ind);
            nodes[childKey].parent = parentKey;
            
            if (point == e[0]) {
              nodes[parentKey].left = childKey;
            } else {
              nodes[parentKey].right = childKey;
            }
            tri.push(e);
          }

          edgeStack.push([point, ind]);
        }
        edgePoint++;
      }
    }

    var rootNode = {};
    rootNode.left = null;
    rootNode.right = null;
    rootNode.parent = null;
    rootNode.value = rootKey;
    rootNode.depth = 0;
    nodes[rootKey] = rootNode;
    while (edgeStack.length) {
      var e$1 = edgeStack.pop();
      var childKey$1 = formatKey(e$1[0], e$1[1]);
      var parentKey$1 = rootKey;

      nodes[childKey$1].parent = parentKey$1;

      if (0 == e$1[0]) {
        nodes[rootKey].left = childKey$1;
      } else {
        nodes[rootKey].right = childKey$1;
      }
    }

    used.forEach(function (value) {
    });

    var solution = [];
    var start = rootKey;

    var maxDepth = 1;

    // TODO CHECK THE LEFT AND RIGHT
    function bfs() {
      var queue = [start];
      while (queue.length > 0) {
        var n = queue.shift();
        var node = nodes[n];
        var currEdge = interiorMap[n];

        if (node.left) {
          var neighborEdge = interiorMap[node.left];
          var neighborNode = nodes[node.left];
          neighborNode.depth = node.depth + 1;
          maxDepth = Math.max(maxDepth, node.depth + 1);
          var e = createEdge(
            currEdge.midpoint,
            neighborEdge.midpoint,
            -1,
            -1,
            node.depth + 1
          );
          queue.push(node.left);
          solution.push(e);
        }

        if (node.right) {
          var neighborEdge$1 = interiorMap[node.right];
          var neighborNode$1 = nodes[node.right];
          neighborNode$1.depth = node.depth + 1;
          maxDepth = Math.max(maxDepth, node.depth + 1);
          var e$1 = createEdge(
            currEdge.midpoint,
            neighborEdge$1.midpoint,
            -1,
            -1,
            node.depth + 1
          );
          queue.push(node.right);
          solution.push(e$1);
        }
      }
    }

    bfs();
    return { solution: solution, maxDepth: maxDepth, nodes: nodes };
  };

  var getCodewordEdges = function (points, codeword) {
    var N = points.length;
    var getWrapIndex = function (idx) { return idx % N; };
    var fillCrossings = function (crossings, start, end) {
      for (var i = start + 1; i < end; i++) {
        crossings[getWrapIndex(i)] = true;
      }
    };
    var findCodeEdges = function (crossings, point, code) {
      // Offset by 2 vertices since edges cannot be next to each other
      var edgePoint = point + 2;
      var edges = [];
      while (code > 0) {
        var ind = getWrapIndex(edgePoint);
        // If there are no crossing at the index, then it's a valid edge
        if (!crossings[ind]) {
          edges.push(getWrapIndex(ind));
          code--;
          fillCrossings(crossings, point, edgePoint);
        }
        edgePoint++;
      }
      return edges;
    };

    var all_edges = [];
    var crossings = new Array(N).fill(false);
    var startIndex = codeword.length - 1;
    for (var i = startIndex; i >= 0; i--) {
      var code = codeword[i];
      var edges = findCodeEdges(crossings, i, code);
      for (var j = 0; j < edges.length; j++) {
        var edge = edges[j];
        var p1 = points[i];
        var p2 = points[edge];
        var e = createEdge(p1, p2, i, edge);
        all_edges.push(e);
      }
    }

    return all_edges;
  };

  /**
   * The order of the edges in e2 is as closely matched to e1 as much as possible
   * If there are at least 2 edge differences, the original e2 is returned
   * Otherwise, an ordered e2 is return
   * @param {Object[]} e1 The previous interior edges
   * @param {Object[]} e2 The current interior edges
   * @return {Object[]} All valid codewords for an N-polygon
   */
  var positionEdges = function (e1, e2) {

    if (e1 == null || e1.length == 0) { return e2; }
    console.log("CALLED");
    console.log(JSON.stringify(e1.map(function (d) { return ("" + d.start_idx + d.end_idx); })), "PREVIOUS");

    console.log(123456789);
    console.log(JSON.stringify(e2.map(function (d) { return ("" + d.start_idx + d.end_idx); })), "CURRENT");

    var new_res = new Array(e1.length).fill(-1);
    var numbers = Array.from(Array(e1.length).keys());
    var unusedIndex = new Set(numbers);

    var idxDict = {};
    for (var i = 0; i < e1.length; i++) {
      var ref = e1[i];
      var start_idx = ref.start_idx;
      var end_idx = ref.end_idx;
      var key = "" + start_idx + end_idx;
      idxDict[key] = i;
    }

    var count = 0;
    var unused = null;
    for (var j = 0; j < e2.length; j++) {
      var ref$1 = e2[j];
      var start_idx$1 = ref$1.start_idx;
      var end_idx$1 = ref$1.end_idx;
      var key$1 = "" + start_idx$1 + end_idx$1;
      if (idxDict[key$1] == undefined) {
        unused = e2[j];
        count += 1;
      } else if (idxDict[key$1] !== j) {
        new_res[idxDict[key$1]] = e2[j];
        unusedIndex.delete(idxDict[key$1]);
      } else {
        new_res[j] = e2[j];
        unusedIndex.delete(j);
      }
    }

    console.log(count, "HEREEEEE");

    if (count > 1) { return e2; }

    var keys = unusedIndex.keys();
    var value = keys.next().value;

    new_res[value] = unused;

    console.log(JSON.stringify(new_res.map(function (d) { return ("" + d.start_idx + d.end_idx); })), "RESULT");
    // console.log(JSON.stringify(new_res), "CHECK ME")
    return new_res;
  };

  var polygon = function () {
    var N;
    var codeword;
    var color;
    var pointColor;
    var radius;
    var pointSize;
    var margin;
    var transDuration;
    var strokeWidth;
    var dash;
    var fontSize;

    var drawDelay;

    var lastEdges;

    var interp;
    var treeInterp;

    var nodes;
    var treePath = [];

    var listeners = d3$1.dispatch("animstart", "animend");

    var my = function (selection) {
      var points = createPolygonPoints(N, radius, margin.left, margin.top);
      var polygonEdges = createPolygonEdges(points);
      var interiorEdges = getCodewordEdges(points, codeword);

      // NOTE: This code is very dangerous, refactor later
      if (lastEdges != null) {
        interiorEdges = positionEdges(lastEdges, interiorEdges);
      }

      treePath = [];
      if (interiorEdges) {
        var treeInfo = createTriangles(codeword, polygonEdges, interiorEdges);
        treePath = treeInfo.solution;
        treeInfo.maxDepth;
        nodes = treeInfo.nodes;
      }

      lastEdges = interiorEdges;
      var t = d3$1.transition().duration(transDuration);
      var pointLine = d3$1.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

      var positionLines = function (lines) {
        lines
          .attr("x1", function (d) { return d.p1.x; })
          .attr("y1", function (d) { return d.p1.y; })
          .attr("x2", function (d) { return d.p2.x; })
          .attr("y2", function (d) { return d.p2.y; });
      };

      var initializeRadius = function (circles) {
        circles.attr("r", 0);
      };

      var growRadius = function (enter, color) {
        enter.transition(t).attr("r", pointSize).attr("fill", color);
      };

      var positionCircles = function (circles) {
        circles.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
      };

      var enterCircles = function (circles, color) {
        circles
          .call(positionCircles)
          .call(initializeRadius)
          .call(growRadius, color);
      };

      var positionText = function (text) {
        text
          .attr("x", function (d) { return d.x - 3 + d.ux * 15; })
          .attr("y", function (d) { return d.y + 6 + d.uy * 15; });
      };

      var calculateDashArr = function (edge) {
        var dashLength = dash
          .split(/[\s,]/)
          .map(function (a) { return parseFloat(a) || 0; })
          .reduce(function (a, b) { return a + b; });

        var dashCount = Math.ceil(edge.dist / dashLength);
        var newDashes = new Array(dashCount).join(dash + " ");
        var dashArray = newDashes + " 0, " + edge.dist;
        return dashArray;
      };

      var exitLines = function (lines) {
        lines
          .attr("x1", function (_) { return 0; })
          .attr("y1", function (_) { return 0; })
          .attr("x2", function (_) { return 0; })
          .attr("y2", function (_) { return 0; });
      };

      selection
        .selectAll(".vertex-label")
        .data(points)
        .join(
          function (enter) {
            enter
              .append("text")
              .attr("class", "vertex-label")
              .attr("font-size", "0px")
              .call(positionText)
              .transition(t)
              .attr("font-size", fontSize)
              .text(function (_, i) { return i; });
          },

          function (update) { return update.call(function (update) { return update.transition(t).call(positionText); }); },
          function (exit) { return exit.transition(t).attr("font-size", "0px").remove(); }
        )
        .transition(t)
        .attr("opacity", "1.0")
        .text(function (_, i) { return i; });

      selection
        .selectAll(".root")
        .data([polygonEdges[N - 1].midpoint])
        .join(
          function (enter) { return enter
              .append("circle")
              .attr("class", "root")
              .call(enterCircles, interp(pointColor)); },

          function (update) { return update.call(function (update) { return update.transition(t).call(positionCircles); }); },
          function (exit) { return exit.transition(t).call(initializeRadius).remove(); }
        );

      selection
        .selectAll(".vertex")
        .data(points)
        .join(
          function (enter) { return enter
              .append("circle")
              .attr("class", "vertex")
              .call(enterCircles, pointColor); },
          function (update) { return update.call(function (update) { return update.transition(t).call(positionCircles); }); },
          function (exit) { return exit.transition(t).call(initializeRadius).remove(); }
        );

      selection
        .selectAll(".polygon-lines")
        .data(polygonEdges)
        .join(
          function (enter) { return enter
              .append("line")
              .attr("class", "polygon-lines")
              .attr("stroke-opacity", "0.0")
              .transition(t)
              .on("start", function () { listeners.call("animstart", null);  })
              .on("end", function () {
                listeners.call("animend", null);
              })
              .attr("stroke-opacity", "1.0")
              .call(positionLines); },
          function (update) { return update.call(function (update) { return update.transition(t).call(positionLines); }); },
          function (exit) { return exit
              .transition(t)
              .on("start", function () { listeners.call("animstart", null); })
              .on("end", function () {
                listeners.call("animend", null);
              })
              .attr("stroke-opacity", "0.0")
              .call(exitLines)
              .remove(); }
        )
        .attr("stroke", color)
        .attr("stroke-width", strokeWidth);

      selection
        .selectAll(".tree-path")
        .data(treePath)
        .join(
          function (enter) {
            enter
              .append("path")
              .attr("class", "tree-path")
              .attr("stroke-width", strokeWidth)
              .attr("d", function (d) { return pointLine([d.p1, d.p2]); })
              .attr("stroke", function (d) { return treeInterp(1-(d.depth / 11)); })
              .attr("opacity", "0.0")
              .transition()
              .delay(
                function (d, _) { return interiorEdges.length * drawDelay + d.depth * drawDelay; }
              )
              // .on("end", (event) => {
              //   listeners.call("interioredgedraw", null);
              // })
              .attr("stroke-dasharray", function (d) { return calculateDashArr(d); })
              .attr("stroke-dashoffset", function (d) { return d.dist; })
              .transition()

              .attr("stroke-opacity", "1.0")
              .duration(1000)
              .attr("opacity", "1.0")
              .attr("stroke-dashoffset", 0)
              .end()
              .then(function () {
                listeners.call("animend", null);
                // finishedAnimating = true
              });
              // .catch(() => {
              //   listeners.call("animend", null);
              // })
          },

          function (update) {
            update.call(function (update) {
              update
                .attr("stroke-dasharray", dash)
                .attr("stroke-dashoffset", null)
                .transition(t)
                .attr("stroke", function (d) { return treeInterp(1-(d.depth / 11)); })
                .attr("d", function (d) { return pointLine([d.p1, d.p2]); });
            });
          },

          function (exit) {
            exit
              .transition(t)
              .attr("stroke-opacity", "0.0")
              .call(exitLines)
              .remove();
          }
        );

      selection
        .selectAll(".interior")
        .data(interiorEdges)
        .join(
          function (enter) {
            enter
              .append("path")
              .attr("class", "interior")
              .attr("stroke-width", strokeWidth)
              .attr("d", function (d) { return pointLine([d.p1, d.p2]); })
              .attr("stroke", function (d) { return interp(d.start_idx / interiorEdges.length); })
              .attr("opacity", "0.0")
              .transition()
              .on("start", function () { listeners.call("animstart", null); })
              .delay(function (_, i) { return i * drawDelay; })
              // .on("end", (_) => {
              //   console.log("draw edge")
                // listeners.call("end", null);
              // })
              .attr("stroke-dasharray", function (d) { return d.dist + " " + d.dist; })
              .attr("stroke-dashoffset", function (d) { return d.dist; })
              .transition()
              .attr("stroke-opacity", "1.0")
              .duration(1000)
              .attr("opacity", "1")
              .attr("stroke-dashoffset", 0);
          },

          function (update) {
            update.call(function (update) {
              update
                .attr("stroke-dasharray", null)
                .attr("stroke-dashoffset", null)
                .transition(t)
                .attr("stroke", function (d) { return interp(d.start_idx / interiorEdges.length); })
                .attr("d", function (d) { return pointLine([d.p1, d.p2]); });
            });
          },

          function (exit) {
            exit
              .transition(t)
              .attr("stroke-opacity", "0.0")
              .call(exitLines)
              .remove();
          }
        );

      selection
        .selectAll(".interiorVertex")
        .data(
          interiorEdges.map(function (e) { return ({
            x: e.midpoint.x,
            y: e.midpoint.y,
            start_idx: e.start_idx,
          }); })
        )
        .join(
          function (enter) { return enter
              .append("circle")
              .attr("class", "interiorVertex")
              .transition()
              .delay(function (_, i) { return i * drawDelay; })
              .call(positionCircles)
              .call(initializeRadius)
              .transition(t)
              .attr("r", pointSize)
              .attr("fill", function (d) { return interp(d.start_idx / interiorEdges.length); }); },
          function (update) { return update.call(function (update) { return update
                .transition(t)
                .call(positionCircles)
                .attr("fill", function (d) { return interp(d.start_idx / interiorEdges.length); }); }
            ); },
          function (exit) { return exit.transition(t).call(initializeRadius).remove(); }
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
    };

    my.treePath = function() {
      return treePath
    };


    return my;
  };

  // Credits to Curran Kelleher!
  // https://vizhub.com/forum/t/episode-11-charts-with-menus/216

  var menu = function () {
    var id;
    var labelText;
    var options;
    var listeners = d3$1.dispatch('change');
    var my = function (selection) {
      selection
        .selectAll('label')
        .data([null])
        .join('label')
        .attr('for', id)
        .text(labelText);

      selection
        .selectAll('select')
        .data([null])
        .join('select')
        .attr('id', id)
        .on('change', function (event) {
          listeners.call('change', null, event.target.value);
        })
        .selectAll('option')
        .data(options)
        .join('option')
        .attr('value', function (d) { return d.value; })
        .text(function (d) { return d.text; });
    };

    my.id = function (_) {
      return arguments.length ? ((id = _), my) : id;
    };

    my.labelText = function (_) {
      return arguments.length
        ? ((labelText = _), my)
        : labelText;
    };

    my.options = function (_) {
      return arguments.length ? ((options = _), my) : options;
    };

    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };

    return my;
  };

  var button = function () {
    var id;
    var labelText;
    var listeners = d3$1.dispatch('click');
    
    var my = function (selection) {
      selection
        .selectAll('button')
        .data([null])
        .join('button')
        .attr('id', id)
        .text(labelText)
        .on('click', function () {
          listeners.call('click', null);
        });
    };

    my.id = function (_) {
      return arguments.length ? ((id = _), my) : id;
    };

    my.labelText = function (_) {
      return arguments.length
        ? ((labelText = _), my)
        : labelText;
    };

    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };

    return my;
  };

  var tree = function () {
    var width;
    var height;
    var margin; 
    var nodes; // Dictionary of nodes 
    var transDuration;
    var treeInterp;
    var interp;
    var points;
    var maxXTransform;
    var nodeSize;
    



    // let id;
    // let labelText;
    // const listeners = dispatch('click');
    
    var my = function (selection) {
      var t = d3$1.transition().duration(transDuration);
      var tree = d3.tree().size([width, height]).separation(function (a, b) {
        return (a.parent == b.parent ? 1 : 2) / a.depth;
      });

      // let color = 
      var initializeRadius = function (circles) {
        circles.attr("r", 0);
      };

      var positionCircles = function (circles) {
        circles.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
      };

      var rootKey = (Object.keys(nodes).length + 1) + ",0";

      var links = [];
      var n = [];
      if (nodes && rootKey in nodes) {
        var root = d3.hierarchy(nodes[rootKey], function (d) {
          d.children = [];
          if (d.left) {
            d.children.push(nodes[d.left]); 
          }
          if (d.right) {
            d.children.push(nodes[d.right]);
          }
          return d.children
        });
        root.x0 = width / 2;
        root.y0 = 0;
        var treeData = tree(root);
        n = treeData.descendants();
        links = treeData.descendants().slice(1); 
        treeData.height;

        var s = {};
        links[0].parent.x -= 150;
        links[0].parent.y += 20;

        for (var i = 0; i < links.length; i++) {
          var currLink = links[i];
          s[currLink.value] = currLink.x;
          
          if (currLink.parent.value in s) {
            currLink.parent.value = s[currLink.parent.value];
          }

          if (currLink.parent.data.left == currLink.data.value) {
            currLink.x = currLink.parent.x - maxXTransform * (1 / currLink.depth);
          } else {
            currLink.x = currLink.parent.x + maxXTransform * (1 / currLink.depth);
          }

          s[currLink.value] = currLink.x;
        }
      }

      selection
        .selectAll('line.link')
        .data(links)
        .join(
          function (enter) {
            enter
              .append('line')
              .attr('class', 'link')
              .attr('data-value', function (d) { return d.data.value; } )
              .attr('stroke-width', 2)
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 0)
              .attr('y2', 0)
              .transition(t)
              .attr('x1', function (d) { return d.parent.x; })
              .attr('y1', function (d) { return d.parent.y; })
              .attr('x2', function (d) { return d.x; })
              .attr('y2', function (d) { return d.y; })
              .attr("stroke", function (d) { return treeInterp(1-(d.depth / 11)); });
          },
          function (update) {
            update
              .transition(t)
                .attr('x1', function (d) { return d.parent.x; })
                .attr('y1', function (d) { return d.parent.y; })
                .attr('x2', function (d) { return d.x; })
                .attr('y2', function (d) { return d.y; })
                .attr("stroke", function (d) { return treeInterp(1-(d.depth / 11)); });
          }, 
          function (exit) {
            exit
              .transition(t)
              .attr("stroke-width", "0.0")
              // .call(exitLines)
              .remove();
              // .attr('stroke-width', 0)
              // .remove()
          }
        );  
        selection
        .selectAll(".real-tree-node")
        .data(n)
        .join(
          function (enter) { return enter
              .append("circle")
              .attr('data-value', function (d) { return d.data.value; })
              .attr("class", "real-tree-node")
              .attr("opacity", "0.0")
              .attr("fill", function (d, i) { return interp(i == 0 ? 0 : +d.data.value.split(",")[0] / (n.length - 1)); })
              // .delay((_, i) => i * drawDelay)
              .call(initializeRadius)
              .transition(t)
              .call(positionCircles)
              .attr("r", nodeSize)
              .attr("opacity", "1.0"); },
          function (update) { return update.call(function (update) { return update
                .transition(t)
                .call(positionCircles)
                .attr("fill", function (d, i) { return interp(i == 0 ? 0 : +d.data.value.split(",")[0] / (n.length - 1)); }); }
            ); },
          function (exit) { return exit.transition(t).call(initializeRadius).remove(); }
        );    
    };

    my.width = function (_) {
      return arguments.length ? ((width = _), my) : width;
    };

    my.height = function (_) {
      return arguments.length ? ((height = _), my) : height;
    };

    my.margin = function (_) {
      return arguments.length ? ((margin = _), my) : margin;
    };

    my.nodes = function (_) {
      return arguments.length ? ((nodes = _), my) : nodes;
    };

    my.transDuration = function (_) {
      return arguments.length ? ((transDuration = _), my) : transDuration;
    };
    
    my.interp = function (_) {
      return arguments.length ? ((interp = _), my) : interp;
    };

    my.treeInterp = function (_) {
      return arguments.length ? ((treeInterp = _), my) : treeInterp;
    };

    my.points = function (_) {
      return arguments.length ? ((points = _), my) : points;
    };

    my.reset = function () {
      nodes = {};
      points = [];
      return my;
    };

    my.update = function(poly) {
      nodes = poly.nodes();
      points = poly.treePath();
      return my
    };

    my.maxXTransform = function (_) {
      return arguments.length ? ((maxXTransform = _), my) : maxXTransform;
    };

    my.nodeSize = function (_) {
      return arguments.length ? ((nodeSize = _), my) : nodeSize;
    };

    return my;
  };

  // https://gist.github.com/mbostock/1125997
  // https://observablehq.com/@mbostock/scrubber
  // https://stackoverflow.com/questions/23048263/pausing-and-resuming-a-transition
  // http://www.ams.org/publicoutreach/feature-column/fcarc-associahedra

  var margin = {
    top: 20,
    right: 30,
    bottom: 7,
    left: 20,
  };

  var treeMargin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  };

  var treeWidth = 600;
  var treeHeight = 250;

  var N = 4;
  var codewords = getCodeWords(N - 2);

  var mapCodewords = function (cws) { return cws.map(function (code) { return ({
      value: code,
      text: code,
    }); }); };

  var createCodewordOptions = function (cws) {
    var noneOption = [
      {
        value: "none",
        text: "None",
      } ];
    var options = noneOption.concat(mapCodewords(cws));
    return options;
  };

  var codeword = [];

  window.innerWidth - margin.left - margin.right;
  var height = window.innerHeight - margin.top - margin.bottom;

  d3$1.select("body").append("h1").text("Rotational Hamiltonian Trees");

  var codewordHeader = d3$1.select("body")
    .append("h3")
    .text(("Codeword: " + codeword));

  var menuContainer = d3$1.select("body")
    .append("div")
    .attr("class", "menu-container");

  var polySvg = d3$1.select("body")
    .append("svg")
    .attr("id", "polygon")
    .attr("width", 250)
    .attr("height", height - 400);

  var treeSvg = d3$1.select("body")
    .append("svg")
    .attr("id", "tree")
    .attr("width", 300)
    .attr("height", height - 400);

  var NMenu = menuContainer.append("div");
  var codewordMenu = menuContainer.append("div");
  var startAnimationButton = menuContainer.append("div");
  var restartDrawButton = menuContainer.append("div");

  d3$1.select("body")
    .append("div")
    .attr('class', "tree");

  var radius = 100;
  var pointSize = 4;

  var color = "black";
  var pointColor = "black";
  var interp = d3["interpolateViridis"];
  var treeInterp = d3["interpolatePlasma"];

  // interpolateYlOrRd

  var NOptions = d3.range(4, 12).map(function (n) { return ({
    value: n,
    text: n,
  }); });

  var animationInter = null;

  var index = 0;
  function playAnimation(poly, t) {
    clearInterval(animationInter);
    index = 0;
    animationInter = setInterval(function () {
      if (index >= codewords.length) {
        index = 0;
        clearInterval(animationInter);
      } else {
        var cw = codewords[index];
        polySvg.call(poly.codeword(cw));
        treeSvg.call(t.update(poly));
        d3$1.select("#codeword-menu").property("selectedIndex", index + 1);
        codewordHeader.text(("Codeword: " + cw));
        index += 1;
      }
    }, 1000);
  }

  var toggle = function (disable) {
    d3$1.select("#codeword-menu").property("disabled", disable);
    d3$1.select("#n-menu").property("disabled", disable);
    d3$1.select("#start-button").property("disabled", disable);
  };


  function main() {
    var cw = menu()
      .id("codeword-menu")
      .labelText("Codeword:")
      .options(createCodewordOptions(codewords))
      .on("change", function (cw) {
        var parsedCodeword = [];
        if (cw != "none") {
          parsedCodeword = cw.split(",");
        } else {
          poly.reset();
        }
        clearInterval(animationInter);
        polySvg.call(poly.codeword(parsedCodeword));
        codewordHeader.text(("Codeword: " + parsedCodeword));

        if (cw != "none") {
          treeSvg.call(t.update(poly));
        } else {
          treeSvg.call(t.reset());
        }
      });

    var nChoiceMenu = menu()
      .id("n-menu")
      .labelText("N:")
      .options(NOptions)
      .on("change", function (n) {
        var cws = getCodeWords(n - 2);
        codewords = cws;
        var options = createCodewordOptions(cws);
        d3$1.select("#codeword-menu").property("selectedIndex", -1);
        codewordMenu.call(cw.options(options));
        clearInterval(animationInter);
        polySvg.call(poly.N(n));
        codewordHeader.text(("Codeword: " + ([])));
        treeSvg.call(t.update(poly));
      });

    var restartButton = button()
      .labelText("Restart")
      .id("restart-button")
      .on("click", function (_) {
        clearInterval(animationInter);
        polySvg.call(poly.reset());
        treeSvg.call(t.reset());
      });

    var startButton = button()
      .labelText("Start anim")
      .id("start-button")
      .on("click", function (_) {
        playAnimation(poly, t);
      });

    var poly = polygon()
      .N(N)
      .codeword(codeword)
      .radius(radius)
      .pointSize(pointSize)
      .pointColor(pointColor)
      .strokeWidth(2)
      .color(color)
      .margin(margin)
      .drawDelay(100)
      .transDuration(1000)
      .interp(interp)
      .treeInterp(treeInterp)
      .dash("3, 2")
      .fontSize("16px")
      .on("animstart", function (_) { return toggle(true); })
      .on("animend", function (_) { return toggle(false); });

    startAnimationButton.call(startButton);
    restartDrawButton.call(restartButton);  
    codewordMenu.call(cw);
    polySvg.call(poly);
    NMenu.call(nChoiceMenu);

    var t = tree()
      .width(treeWidth)
      .height(treeHeight)
      .nodes({})
      .margin(treeMargin)
      .transDuration(1000)
      .interp(interp)
      .treeInterp(treeInterp)
      .maxXTransform(50)
      .nodeSize(4);
    treeSvg.call(t);
  }

  main();

})(d3);
//# sourceMappingURL=bundle.js.map
