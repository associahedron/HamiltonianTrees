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
  // Implementation of Lemma 1: (Valid Codewords) [Zerling]
  // NOTE THAT THIS COULD BE MORE EFFICIENT...
  // Note that codeword should equal to n-gon sides - 2 (n)
  // Example: cw = [3, 0, 0, 0], n = 4
  // This is valid!
  function isValidCodeword(cw, n) {
    var isValid = true;
    var nums = cw.map(function (v) { return +v; });
    for (var i = 1; i < n - 1; i++) {
      var sum = 0;
      for (var j = i + 1; j < n; j++) {
        sum += nums[j];
      }
      var wi = nums[i];
      if (wi > n - i - sum) {
        isValid = false;
      }
    }

    var s = 0;
    for (var j$1 = 1; j$1 < n; j$1++) {
      s += nums[j$1];
    }

    var w0 = nums[0];
    if (w0 != n - 1 - s) {
      isValid = false;
    }

    return isValid;
  }

  var formatKey = function (start, end) {
    return (start + "," + end)
  };

  var keyFromArr = function (arr) {
    return arr.join(',')
  };

  var parseKey = function (key) {
    return key.split(',').map(function (v) { return +v; })
  };

  var idxFunction = function (N) { return function (idx) { return idx % N; }; };

  /**
   * @typedef {Object} Point 
   * @property {number} x
   * @property {number} y
   */

  /**
   * @typedef {Object} Edge 
   * @property {Point} p1
   * @property {Point} p2
   * @property {Point} midpoint The midpoint of the edge
   * @property {number} start_idx The index of p1 in the polygon
   * @property {number} end_idx The index of p2 in the polygon
   * @property {number} depth The depth of the edge in the tree
   * @property {number} distance The distance between p1 and p2
   * @property {() => string} getKey The key of edge using the start index and end index
   */

  /**
   * @typedef {Object} Triangle 
   * @property {Point} p1
   * @property {Point} p2
   * @property {Point} p3
   * @property {() => Point} getCentroid
   */

  /**
   * @param {Point} p1 
   * @param {Point} p2
   * @param {number} start The index of p1 in the polygon
   * @param {number} end The index of p2 in the polygon
   * @param {number} depth The depth of the edge in the tree
   * @return {Edge} All valid codewords for an N-polygon
   */
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

  /**
   * @param {number} N The number of sides
   * @param {number} r The radius of the polygon
   * @param {number} leftOffset The x offset
   * @param {number} topOffset The y offset
   * @return {number[]} A list of vertices for the polygon
   */
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

      // TODO Refactor to remove unit vector
      var point = { x: x, y: y, ux: ux, uy: uy };
      points.push(point);
    }
    points.reverse();
    return points;
  };

  /**
   * @param {Point[]} points A list of points for an N-gon
   * @return {Edge[]} A list of edges for that N-gon
   */
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


  /*
  NODES
  "0,6": Object { right: "1,6", parent: "7,0", depth: 1, … }
  "1,4": Object { right: "2,4", parent: "1,5", depth: 4, … }
  "1,5": Object { left: "1,4", parent: "1,6", depth: 3, … }
  "1,6": Object { left: "1,5", parent: "0,6", depth: 2, … }
  "2,4": Object { parent: "1,4", depth: 5, value: "2,4", … }
  "7,0": Object { left: "0,6", value: "7,0", depth: 0, … }
  */
  // TODO REFACTOR THIS

  /**
   * @param {Point} p1 
   * @param {Point} p2
   * @property {number} start The index of p1 in the polygon
   * @property {number} end The index of p2 in the polygon
   * @property {number} depth The depth of the edge in the tree
   * @return {Edge} All valid codewords for an N-polygon
   */

  // Solution is the edges of the tree
  // Nodes is a dictionary with the index and end index being the key and {"left":null,"right":null,"parent":"1,4","depth":4,"value":"2,4"}

  var createTriangles = function (codeword, polygonEdges, interiorEdges, points) {
    if (!interiorEdges.length) { return { solution: [], maxDepth: 1, nodes: null, triangles: {}}; }

    var interiorMap = {};

    var N = polygonEdges.length;
    var interiorN = interiorEdges.length;

    for (var i = 0; i < interiorN; i++) {
      var edge = interiorEdges[i];
      var key = edge.getKey();
      interiorMap[key] = edge;
    }


    for (var i$1 = 0; i$1 < polygonEdges.length; i$1++) {
      var edge$1 = polygonEdges[i$1];
      var key$1 = edge$1.getKey();
      interiorMap[key$1] = edge$1;
    }

    var rootKey = (N - 1) + ",0";
    // console.log(JSON.stringify(interiorMap), "INTERIOR MAP")
    
    var getWrapIndex = idxFunction(N);
    
    var fillCrossings = function (crossings, start, end) {
      for (var i = start + 1; i < end; i++) {
        crossings[getWrapIndex(i)] = true;
      }
    };

    var nodes = {};

    for (var i$2 = 0; i$2 < polygonEdges.length; i$2++) {
      var edge$2 = polygonEdges[i$2];
      var key$2 = edge$2.getKey();
      nodes[key$2] = {
        left: null,
        right: null,
        parent: null,
        depth: 0,
        value: key$2,
        leaf: true,
        inorderPos: null,
      };
    }

    var triangles = [];

    var crossings = new Array(N).fill(false);

    var polyEdgesUsed = new Array(N).fill(false);

    var used = new Set(d3$1.range(N));

    var edgeStack = [];
    var startIndex = codeword.length - 1;

    var iterOrder = [];

    for (var i$3 = startIndex; i$3 >= 0; i$3--) {
      var point = i$3;
      var code = codeword[i$3];

      var edgePoint = point + 2;
      while (code > 0) {
        var ind = getWrapIndex(edgePoint);
        // If there are no crossing at the index, then it's a valid edge
        if (!crossings[ind]) {
          var tri = [];
          tri.push([point, ind]);
          code--;
          fillCrossings(crossings, point, edgePoint);

          var key$3 = formatKey(point, ind);
          var node = {
            left: null,
            right: null,
            parent: null,
            depth: 0,
            value: key$3,
            leaf: false,
            inorderPos: null,
          };
          nodes[key$3] = node;

          var checkRange = d3$1.range(point, edgePoint).map(function (e) { return getWrapIndex(e); });
          for (var j = 0; j < checkRange.length; j++) {
            var edge$3 = checkRange[j];
            // IF the edge is not used, add it to the triangle
            if (!polyEdgesUsed[edge$3]) {
              polyEdgesUsed[edge$3] = true;
              
              tri.push([edge$3, getWrapIndex(edge$3 + 1)]);
              // let childKey = formatKey(edge, getWrapIndex(edge + 1));
              var parentKey = formatKey(point, ind);
              iterOrder.push(parentKey);
              used.delete(edge$3);
            }
          }
          
          // If we don't make a triangle, then we know we have to use the interior edges
          while (tri.length < 3) {
            var e = edgeStack.pop();
            // let childKey = formatKey(e[0], e[1])
            var parentKey$1 = formatKey(point, ind);
            iterOrder.push(parentKey$1);
            tri.push(e);
          }

          triangles.push(tri);

          edgeStack.push([point, ind]);
        }
        edgePoint++;
      }
    }

    var rootNode = {
      left: null,
      right: null,
      parent: null,
      value: rootKey,
      depth: 0,
      leaf: false
    };

    nodes[rootKey] = rootNode;

    // ==== ADD THE LAST TRIANGLE IN THE STACK
    var lastTriangle = [];
    while (edgeStack.length) {
      var e$1 = edgeStack.pop();
      lastTriangle.push(e$1);
    }

    used.forEach(function (value) {
      lastTriangle.push([value, getWrapIndex(value + 1)]);
    });

    triangles.push(lastTriangle);
    iterOrder.push(rootKey);
    triangles.reverse();
    iterOrder.reverse();
    iterOrder = Array.from(new Set(iterOrder));
    for (var i$4 = 0; i$4 < iterOrder.length; i$4++) {
      var triangleIndexes = triangles[i$4];

      var parentKey$2 = iterOrder[i$4];
      var parentArr = parseKey(parentKey$2);

      for (var j$1 = 0; j$1 < triangleIndexes.length; j$1++) {
        var indexes = triangleIndexes[j$1];
        var triKey = keyFromArr(indexes);
        if (triKey == parentKey$2) {
          continue
        } else {
          nodes[triKey].parent = parentKey$2;
          if (i$4 == 0) {
            if (indexes[0] == parentArr[1]) {
              nodes[parentKey$2].left = triKey;
            } else {
              nodes[parentKey$2].right = triKey;
            }
          } else {
            if (indexes[0] == parentArr[0]) {
              nodes[parentKey$2].left = triKey;
            } else {
              nodes[parentKey$2].right = triKey;
            }
          }
        } 
      }
    }
    var tris = createTriangleFromIndex(triangles, points, iterOrder);
    var solution = [];

    var maxDepth = 1;

    var start = rootKey;

    // Solution is the edges of the tree
    // Nodes is a dictionary with the index and end index being the key and {"left":null,"right":null,"parent":"1,4","depth":4,"value":"2,4"}
    function bfs() {
      var queue = [start];

      // Create the first edge from the root to first centroid
      var e = createEdge(
        interiorMap[start].midpoint,
        tris[start].getCentroid(),
        -1,
        -1,
        0
      );
      solution.push(e);

      while (queue.length > 0) {
        var n = queue.shift();
        var node = nodes[n];
        var currEdge = interiorMap[n];

        if (node.left) {
          var neighborEdge = interiorMap[node.left];

          var startPoint = currEdge.midpoint;
          var endPoint = neighborEdge.midpoint;

          if (n in tris) {
            startPoint = tris[n].getCentroid();
          }
          if (node.left in tris) {
            endPoint = tris[node.left].getCentroid();
          }
          
          var neighborNode = nodes[node.left];
          neighborNode.depth = node.depth + 1;
          maxDepth = Math.max(maxDepth, node.depth + 1);
          var e$1 = createEdge(
            startPoint,
            endPoint,
            -1,
            -1,
            node.depth + 1
          );
          queue.push(node.left);
          solution.push(e$1);
        }

        if (node.right) {
          var neighborEdge$1 = interiorMap[node.right];
          var startPoint$1 = currEdge.midpoint;
          var endPoint$1 = neighborEdge$1.midpoint;

          if (n in tris) {
            startPoint$1 = tris[n].getCentroid();
          }
          if (node.right in tris) {
            endPoint$1 = tris[node.right].getCentroid();
          }
          
          var neighborNode$1 = nodes[node.right];
          neighborNode$1.depth = node.depth + 1;
          maxDepth = Math.max(maxDepth, node.depth + 1);
          var e$2 = createEdge(
            startPoint$1,
            endPoint$1,
            -1,
            -1,
            node.depth + 1
          );
          queue.push(node.right);
          solution.push(e$2);
        }
      }
    }

    bfs();
    return { solution: solution, maxDepth: maxDepth, nodes: nodes, triangles: tris };
  };


  var getCodewordEdges = function (points, codeword) {
    var N = points.length;
    var getWrapIndex = idxFunction(N);

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
   * @param {Point} p1 
   * @param {Point} p2
   * @param {Point} p3
   * @return {Point} The centroid
   */
  var centroid = function (p1, p2, p3) {
    var x = (p1.x + p2.x + p3.x) / 3;
    var y = (p1.y + p2.y + p3.y) / 3;
    var centroid = { x: x, y: y };
    return centroid
  };


  /**
   * @param {number[][]} triIndexes The triangle represented by the edge indexes
   * [[1, 2], [2, 3], [3, 1]] 
   * @param {Point[]} points The list of points of an N-gon
   * @return {Triangle[]} The centroid
   */
  var createTriangleFromIndex = function (triIndexes, points, iterOrder) {
    var triangles = {};
    for (var i = 0; i < iterOrder.length; i++) {
      var currEdge = iterOrder[i];
      var triangleIndexes = triIndexes[i];
      var indexSet = new Set();
      for (var j = 0; j < triangleIndexes.length; j++) {

        var indexes = triangleIndexes[j];
        indexSet.add(indexes[0]);
        indexSet.add(indexes[1]);
      }

      var arr = Array.from(indexSet);
      var p1 = points[arr[0]];
      var p2 = points[arr[1]];
      var p3 = points[arr[2]];
      var tri = createTriangle(p1, p2, p3);
      triangles[currEdge] = tri;
    }

    return triangles
  };


  /**
   * @typedef {Object} Triangle 
   * @param {Point} p1
   * @param {Point} p2
   * @param {Point} p3
   * @return {Triangle}
   */
  var createTriangle = function (p1, p2, p3) {
    return {
      p1: p1, p2: p2, p3: p3,
      getCentroid: function () { return centroid(p1, p2, p3); }
    }
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
    // console.log(JSON.stringify(e1.map(d => ("" + d.start_idx + d.end_idx))), "PREVIOUS")

    // console.log(JSON.stringify(e2.map(d => ("" + d.start_idx + d.end_idx))), "CURRENT")

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

    if (count > 1) { return e2; }

    var keys = unusedIndex.keys();
    var value = keys.next().value;

    new_res[value] = unused;
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

      var triangles = [];
      if (interiorEdges) {
        var treeInfo = createTriangles(codeword, polygonEdges, interiorEdges, points);
        treePath = treeInfo.solution;
        treeInfo.maxDepth;
        nodes = treeInfo.nodes;
        triangles = Object.values(treeInfo.triangles);
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
          .attr("x", function (_, i) { return points[i].x - 3 + points[i].ux * 15; })
          .attr("y", function (_, i) { return points[i].y + 6 + points[i].uy * 15; });
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
        .data(codeword)
        .join(
          function (enter) {
            enter
              .append("text")
              .attr("class", "vertex-label")
              .attr("opacity", "0.0")
              .attr("font-size", fontSize)
              .call(positionText)
              .transition(t)

              .attr("opacity", "1.0")
              .text(function (d) { return d; });
               
              // });
          },

          function (update) { return update.call(function (update) { return update
            // .attr("opacity", "0.0")
            .transition(t)
            // .attr("font-size", fontSize)
            // .attr("opacity", "1.0")
            .text(function (d) { return d; })
            .call(positionText); }); },
          function (exit) { return exit
            .transition(t)
            .attr("opacity", "0.0")
            .remove(); }
        );
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
        .data(polygonEdges.map(function (e) { return e.midpoint; } ).slice(0, -1))
        .join(
          function (enter) { return enter
              .append("circle")
              .attr("class", "edge-node")
              .call(enterCircles, interp(7 / 11)); },

          function (update) { return update.call(function (update) { return update.transition(t).call(positionCircles); }); },
          function (exit) { return exit.transition(t).call(initializeRadius).remove(); }
        );
    
      selection
        .select("#poly-nodes")
        .selectAll(".root")
        .data(polygonEdges.map(function (e) { return e.midpoint; } ).slice(-1))
        .join(
          function (enter) { return enter
              .append("circle")
              .attr("class", "root")
              .call(enterCircles, "black"); },

          function (update) { return update.call(function (update) { return update.transition(t).call(positionCircles); }); },
          function (exit) { return exit.transition(t).call(initializeRadius).remove(); }
        );

      selection
        .select("#poly-nodes")
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
        .select("#poly-links")
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
        .select("#poly-interior-links")
        .selectAll(".tree-path")
        .data(treePath)
        .join(
          function (enter) {
            enter
              .append("path")
              .attr("class", "tree-path")
              .attr("stroke-width", strokeWidth)
              .attr("d", function (d) { return pointLine([d.p1, d.p2]); })
              .attr("stroke", function (d) { return treeInterp(1 - (d.depth / 11)); }) // 11 is the max N
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
              .attr("opacity", "1")
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
        .select("#poly-links")
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

      // TODO
      selection
        .selectAll(".interiorVertex")
        .data(
          triangles.map(function (tri) { return ({
            x: tri.getCentroid().x,
            y: tri.getCentroid().y,
            start_idx: 0,
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
              .attr("fill", function (d) { return interp(3 / 11); }); },
          function (update) { return update.call(function (update) { return update
                .transition(t)
                .call(positionCircles)
                .attr("fill", function (d) { return interp(3/ 11); }); }
            ); },
          function (exit) { return exit.transition(t).call(initializeRadius).remove(); }
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
    var listeners = d3$1.dispatch('change', 'focus');
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
        .on('focus', function (event) {
          listeners.call('focus', null);
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

  var input = function () {
    var id;
    var placeholder;
    var listeners = d3$1.dispatch("confirm", "focusout");

    var my = function (selection) {
      selection
        .selectAll("input")
        .data([null])
        .join("input")
        .attr("placeholder", placeholder)
        .attr("id", id)
        .on("focusout", function (e) {
          console.log(e.target.value);
          listeners.call("focusout", null, e.target.value);
        })
        .on("keyup", function (e) {
          if (e.key == "Enter") {
            listeners.call("confirm", null, e.target.value);
          }
        });
    };

    my.id = function (_) {
      return arguments.length ? ((id = _), my) : id;
    };

    my.placeholder = function (_) {
      return arguments.length ? ((placeholder = _), my) : placeholder;
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
    var N;
    var transDuration;
    var treeInterp;
    var interp;
    var points;
    var maxXTransform;
    var nodeSize;
    
    var my = function (selection) {
      var t = d3$1.transition().duration(transDuration);
      var tree = d3.cluster()
      .nodeSize([20, 25]);
      // .size([width, height])
      // .nodeSize([20, 20])
      // .separation((a, b) => {
      //   return (a.parent == b.parent ? 1 : 10)
      // })

      var initializeRadius = function (circles) {
        circles.attr("r", 0);
      };

      // const growRadius = (enter, color) => {
      //   enter.transition(t).attr("r", nodeSize).attr("fill", color);
      // };

      var positionCircles = function (circles) {
        circles.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
      };

      var rootKey = (N - 1) + ",0";

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

        var treeData = tree(root);
        // treeData.y = treeData.y + 20

        n = treeData.descendants();

        for (var i = 0; i < n.length; i++) {
          n[i].x = n[i].x + 30 * N;
          n[i].y = n[i].y + 80;
        }

    
        n[0].y = n[0].y - (N * 5);
        links = treeData.descendants().slice(1); 
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
              .attr("stroke", function (d) { return treeInterp(1- (d.depth / 11)); });
          },
          function (update) {
            update
              .transition(t)
                .attr('x1', function (d) { return d.parent.x; })
                .attr('y1', function (d) { return d.parent.y; })
                .attr('x2', function (d) { return d.x; })
                .attr('y2', function (d) { return d.y; })
                .attr("stroke", function (d) { return treeInterp(1- (d.depth / 11)); });
          }, 
          function (exit) {
            exit
              .transition(t)
              .attr("stroke-width", "0.0")
              .remove();
          }
        );  
        selection
        .selectAll(".real-tree-node")
        .data(n)
        .join(
          function (enter) { return enter
              .append("circle")
              .attr('data-value', function (d) { return d.data.value })
              .attr("class", "real-tree-node")
              .attr("opacity", "0.0")
              .attr("fill", function (d) { 

                return d.data.leaf ? interp(7 / 11) : interp(3 / 11)
              })
              .call(initializeRadius)
              .transition(t)
              .call(positionCircles)
              .attr("r", nodeSize)
              .attr("opacity", "1.0"); },
          function (update) { return update.call(function (update) { return update
                .transition(t)
                .call(positionCircles)
                .attr("fill", function (d) { return d.data.leaf ? "black" : interp(3 / 11); }); }
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

    my.N = function (_) {
      return arguments.length ? ((N = _), my) : N;
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
      N = null;
      return my;
    };

    my.update = function(poly) {
      nodes = poly.nodes();
      points = poly.treePath();
      N = poly.N();
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

  var N = 2;
  var codewords = getCodeWords(N);

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
    .attr("height", height - 300);

  polySvg.append('g').attr('id', 'poly-links');
  polySvg.append('g').attr('id', 'poly-interior-links');
  polySvg.append('g').attr('id', 'poly-nodes');

  var treeSvg = d3$1.select("body")
    .append("svg")
    .attr("id", "tree")
    .attr("width", 800)
    .attr("height", height - 300);

  menuContainer.append("div");

  var NInputLabel = d3$1.select("div").append("label").text("Type N and press Enter: ");
  var NInput = menuContainer.append("div");


  var codewordMenu = menuContainer.append("div");
  var startAnimationButton = menuContainer.append("div");
  var restartDrawButton = menuContainer.append("div");
  var codewordLabel = d3$1.select("div").append("label").text("Type codeword and press Enter: ");
  var inputButton = menuContainer.append("div");

  var radius = 100;
  var pointSize = 4;

  var color = "black";
  var pointColor = "black";
  var interp = d3["interpolateViridis"];
  var treeInterp = d3["interpolatePlasma"];

  // const NOptions = d3.range(2, 10).map((n) => ({
  //   value: n,
  //   text: n,
  // }));

  var animationInter = null;
  var warned = false;

  var index = 0;
  function playAnimation(poly, t) {
    var started = poly.treePath().length == 0;
    function callback() {
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

        clearInterval(animationInter);
        var timeout = 0;
        if (started) {
          started = false;
          timeout = 250 * poly.N();
        }

        setTimeout(function () {
          animationInter = setInterval(callback, 1000);
        }, timeout);


      }
    }

    clearInterval(animationInter);
    index = 0;
    animationInter = setInterval(callback, 1000);
  }

  var toggle = function (disable) {
    d3$1.select("#codeword-menu").property("disabled", disable);
    d3$1.select("#n-menu").property("disabled", disable);
    d3$1.select("#n-input").property("disabled", disable);
    d3$1.select("#start-button").property("disabled", disable);
  };

  function main() {
    var cw = menu()
      .id("codeword-menu")
      .labelText("Codeword:")
      .options(createCodewordOptions(codewords))
      .on("focus", function () {
        var n = poly.N() - 2;
        if (!codewords.length || codewords[0].length != n) {
          var cws = getCodeWords(n);
          codewords = cws;
          var options = createCodewordOptions(cws);
          d3$1.select("#codeword-menu").property("selectedIndex", -1);
          codewordMenu.call(cw.options(options));
        }
      })
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
        codewordLabel.text("Type codeword and press Enter:  ").style("color", "black");

        if (cw != "none") {
          treeSvg.call(t.update(poly));
        } else {
          treeSvg.call(t.reset());
        }
      });

    // const nChoiceMenu = menu()
    //   .id("n-menu")
    //   .labelText("N:")
    //   .options(NOptions)
    //   .on("focus", () => {
    //     const n = poly.N() - 2
    //     const cws = getCodeWords(n);
    //     codewords = cws;
    //     const options = createCodewordOptions(cws);
    //     select("#codeword-menu").property("selectedIndex", -1);
    //     codewordMenu.call(cw.options(options));
    //   })
    //   .on("change", (n) => {
    //     const cws = getCodeWords(n);
    //     codewords = cws;
    //     const options = createCodewordOptions(cws);
    //     select("#codeword-menu").property("selectedIndex", -1);
    //     codewordMenu.call(cw.options(options));
    //     clearInterval(animationInter);
    //     polySvg.call(poly.N(+n + 2));
    //     codewordHeader.text(`Codeword: ${[]}`);
    //     treeSvg.call(t.update(poly));
    //     codewordLabel.text("Enter codeword: ").style("color", "black");
    //   });

    var restartButton = button()
      .labelText("Restart")
      .id("restart-button")
      .on("click", function (_) {
        clearInterval(animationInter);
        polySvg.call(poly.reset());
        treeSvg.call(t.reset());
      });

    var startButton = button()
      .labelText("View Hamiltonian Path")
      .id("start-button")
      .on("click", function (_) {
        var n = poly.N() - 2;
        if (!codewords.length || codewords[0].length != n) {
          var cws = getCodeWords(n);
          codewords = cws;
          var options = createCodewordOptions(cws);
          d3$1.select("#codeword-menu").property("selectedIndex", -1);
          codewordMenu.call(cw.options(options));
        }
        playAnimation(poly, t);
      });

    


    var onNConfirm = function (value) {
      var validationRegex = /^[1-9][0-9]*$/;
      if (validationRegex.test(value)) {
        var n  = parseInt(value);
        if (n >= 2) {
          // const cws = getCodeWords(n);
          // codewords = cws;
          // const options = createCodewordOptions(cws);
          d3$1.select("#codeword-menu").property("selectedIndex", -1);
          // codewordMenu.call(cw.options(options));
          clearInterval(animationInter);
          polySvg.call(poly.N(+n + 2));
          codewordHeader.text(("Codeword: " + ([])));
          treeSvg.call(t.update(poly));
          NInputLabel.text("Type N and press Enter: ").style("color", "black");
          if (n > 9 && !warned) {
            warned = true;
            alert("Note: When viewing the codewords or visualizing the Hamiltonian path for n > 9, your browser may slow down, especially for larger values of n");
          }
        } else {
          NInputLabel.text("N must be greater than 1.").style("color", "red");
        }
      } else {
        NInputLabel.text("Invalid N.").style("color", "red");
      }

    };

    var nInput = input()
      .id("n-input")
      // .placeholder("2, 7, etc")
      .on("focusout", function (value) {
        onNConfirm(value);
      })
      .on("confirm", function (value) {
        onNConfirm(value);
      });



    var onCodewordConfirm = function (value) {
      value = value.replaceAll(" ", "");
      var validationRegex = /^(\d+,)*\d+$/;
      if (validationRegex.test(value)) {
        var codeword = value.split(",");
        var n = poly.N();
        if (codeword.length == n - 2 && isValidCodeword(codeword, n - 2)) {
          clearInterval(animationInter);
          polySvg.call(poly.codeword(codeword));
          codewordHeader.text(("Codeword: " + codeword));
          treeSvg.call(t.update(poly));
          codewordLabel.text("Type codeword and press Enter: ").style("color", "black");
        } else {
          codewordLabel.text("Invalid codeword.").style("color", "red");
        }
      } else {
        codewordLabel.text("Invalid input.").style("color", "red");
      }
    };

    var codewordInput = input()
      .id("codeword-input")
      .on("focusout", function (value) {
        onCodewordConfirm(value);
      })
      .on("confirm", function (value) {
        onCodewordConfirm(value);
      });

    var poly = polygon()
      .N(N + 2)
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
    inputButton.call(codewordInput);
    codewordMenu.call(cw);
    NInput.call(nInput);
    polySvg.call(poly);
    // NMenu.call(nChoiceMenu);

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
