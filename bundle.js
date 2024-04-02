(function (d3$1) {
  'use strict';

  /**
   * @param {number} n  N-polygon sides
   * @return {number[][]} All valid codewords for an N-polygon
   */
  function getCodeWords(n) {
    const UP = 0;
    const DOWN = 1;
    let codeword = new Array(n).fill(-1);
    let direction = new Array(n).fill(-1);
    let pushPoint = new Array(n).fill(-1);
    let maxValue = new Array(n).fill(-1);
    let codeWordList = [];
    function initialize() {
      codeword[0] = n - 1;
      for (let j = 1; j < n; j++) {
        codeword[j] = 0;
        pushPoint[j] = 0;
      }
      codeWordList.push([...codeword]);
    }
    function generate_all_trees(position) {
      if (position === 0) {
        return;
      }
      if (position === n - 1) {
        maxValue[position] = 1;
      } else if (position !== 0) {
        maxValue[position] = maxValue[position + 1] + 1 - codeword[position + 1];
      }
      if (codeword[position] == 0) {
        direction[position] = UP;
      } else {
        direction[position] = DOWN;
      }
      generate_all_trees(position - 1);
      for (let i = 0; i < maxValue[position]; i++) {
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
          pushPoint[position + 1] = pushPoint[position];
        }
      }
    }
    function push(i, j) {
      codeword[i] = codeword[i] - 1;
      codeword[j] = codeword[j] + 1;
      codeWordList.push([...codeword]);
    }
    function pull(i, j) {
      codeword[i] = codeword[i] + 1;
      codeword[j] = codeword[j] - 1;
      codeWordList.push([...codeword]);
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
    let isValid = true;
    let nums = cw.map(v => +v);
    for (let i = 1; i < n - 1; i++) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += nums[j];
      }
      let wi = nums[i];
      if (wi > n - i - sum) {
        isValid = false;
      }
    }
    let s = 0;
    for (let j = 1; j < n; j++) {
      s += nums[j];
    }
    let w0 = nums[0];
    if (w0 != n - 1 - s) {
      isValid = false;
    }
    return isValid;
  }

  // https://github.com/associahedron/convexpolygonexplore/blob/81e57b2e5f98c1575c8601c2be784c90304e1236/codewords.py#L38

  const formatKey = (start, end) => {
    return `${start},${end}`;
  };
  const keyFromArr = arr => {
    return arr.join(',');
  };
  const parseKey = key => {
    return key.split(',').map(v => +v);
  };
  const idxFunction = N => idx => idx % N;

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
  const createEdge = (p1, p2, start, end, depth = -1) => {
    let x = (p1.x + p2.x) / 2;
    let y = (p1.y + p2.y) / 2;
    let x_diff = p1.x - p2.x;
    let y_diff = p1.y - p2.y;
    let dist = Math.hypot(x_diff, y_diff);
    return {
      p1,
      p2,
      midpoint: {
        x,
        y
      },
      dist,
      start_idx: start,
      end_idx: end,
      getKey: () => `${start},${end}`,
      depth
    };
  };

  /**
   * @param {number} N The number of sides
   * @param {number} r The radius of the polygon
   * @param {number} leftOffset The x offset
   * @param {number} topOffset The y offset
   * @return {number[]} A list of vertices for the polygon
   */
  const createPolygonPoints = (N, r, leftOffset, topOffset) => {
    let points = [];
    let inc = 2 * Math.PI / N;
    for (let i = 0; i < N; i++) {
      let theta = inc * (i + 1) + Math.PI * 3 / 2 - inc / 2;
      let r_x = r + leftOffset;
      let r_y = r + topOffset;
      let x = r * Math.cos(theta) + r_x;
      let y = r * Math.sin(theta) + r_y;
      let vec_x = x - r_x;
      let vec_y = y - r_y;
      let mag = Math.sqrt(vec_x * vec_x + vec_y * vec_y);
      let ux = vec_x / mag;
      let uy = vec_y / mag;

      // TODO Refactor to remove unit vector
      let point = {
        x,
        y,
        ux,
        uy
      };
      points.push(point);
    }
    points.reverse();
    return points;
  };

  /**
   * @param {Point[]} points A list of points for an N-gon
   * @return {Edge[]} A list of edges for that N-gon
   */
  const createPolygonEdges = points => {
    let edges = [];
    const N = points.length;
    for (let i = 0; i < N; i++) {
      let curr_point = points[i];
      let next_point_idx = (i + 1) % N;
      let next_point = points[next_point_idx];
      let edge = createEdge(curr_point, next_point, i, next_point_idx);
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

  const createTriangles = (codeword, polygonEdges, interiorEdges, points) => {
    if (!interiorEdges.length) return {
      solution: [],
      maxDepth: 1,
      nodes: null,
      triangles: {}
    };
    let interiorMap = {};
    let N = polygonEdges.length;
    let interiorN = interiorEdges.length;
    for (let i = 0; i < interiorN; i++) {
      let edge = interiorEdges[i];
      let key = edge.getKey();
      interiorMap[key] = edge;
    }
    for (let i = 0; i < polygonEdges.length; i++) {
      let edge = polygonEdges[i];
      let key = edge.getKey();
      interiorMap[key] = edge;
    }
    const rootKey = `${N - 1},0`;
    // console.log(JSON.stringify(interiorMap), "INTERIOR MAP")

    const getWrapIndex = idxFunction(N);
    const fillCrossings = (crossings, start, end) => {
      for (let i = start + 1; i < end; i++) {
        crossings[getWrapIndex(i)] = true;
      }
    };
    let nodes = {};
    for (let i = 0; i < polygonEdges.length; i++) {
      let edge = polygonEdges[i];
      let key = edge.getKey();
      nodes[key] = {
        left: null,
        right: null,
        parent: null,
        depth: 0,
        value: key,
        leaf: true,
        inorderPos: null
      };
    }
    let triangles = [];
    let crossings = new Array(N).fill(false);
    let polyEdgesUsed = new Array(N).fill(false);
    let used = new Set(d3$1.range(N));
    let edgeStack = [];
    let startIndex = codeword.length - 1;
    let iterOrder = [];
    for (let i = startIndex; i >= 0; i--) {
      let point = i;
      let code = codeword[i];
      let edgePoint = point + 2;
      while (code > 0) {
        let ind = getWrapIndex(edgePoint);
        // If there are no crossing at the index, then it's a valid edge
        if (!crossings[ind]) {
          let tri = [];
          tri.push([point, ind]);
          code--;
          fillCrossings(crossings, point, edgePoint);
          let key = formatKey(point, ind);
          let node = {
            left: null,
            right: null,
            parent: null,
            depth: 0,
            value: key,
            leaf: false,
            inorderPos: null
          };
          nodes[key] = node;
          let checkRange = d3$1.range(point, edgePoint).map(e => getWrapIndex(e));
          for (let j = 0; j < checkRange.length; j++) {
            let edge = checkRange[j];
            // IF the edge is not used, add it to the triangle
            if (!polyEdgesUsed[edge]) {
              polyEdgesUsed[edge] = true;
              tri.push([edge, getWrapIndex(edge + 1)]);
              // let childKey = formatKey(edge, getWrapIndex(edge + 1));
              let parentKey = formatKey(point, ind);
              iterOrder.push(parentKey);
              used.delete(edge);
            }
          }

          // If we don't make a triangle, then we know we have to use the interior edges
          while (tri.length < 3) {
            let e = edgeStack.pop();
            // let childKey = formatKey(e[0], e[1])
            let parentKey = formatKey(point, ind);
            iterOrder.push(parentKey);
            tri.push(e);
          }
          triangles.push(tri);
          edgeStack.push([point, ind]);
        }
        edgePoint++;
      }
    }
    let rootNode = {
      left: null,
      right: null,
      parent: null,
      value: rootKey,
      depth: 0,
      leaf: false
    };
    nodes[rootKey] = rootNode;

    // ==== ADD THE LAST TRIANGLE IN THE STACK
    let lastTriangle = [];
    while (edgeStack.length) {
      let e = edgeStack.pop();
      lastTriangle.push(e);
    }
    used.forEach(value => {
      lastTriangle.push([value, getWrapIndex(value + 1)]);
    });
    triangles.push(lastTriangle);
    iterOrder.push(rootKey);
    triangles.reverse();
    iterOrder.reverse();
    iterOrder = Array.from(new Set(iterOrder));
    for (let i = 0; i < iterOrder.length; i++) {
      let triangleIndexes = triangles[i];
      let parentKey = iterOrder[i];
      let parentArr = parseKey(parentKey);
      for (let j = 0; j < triangleIndexes.length; j++) {
        let indexes = triangleIndexes[j];
        let triKey = keyFromArr(indexes);
        if (triKey == parentKey) {
          continue;
        } else {
          nodes[triKey].parent = parentKey;
          if (i == 0) {
            if (indexes[0] == parentArr[1]) {
              nodes[parentKey].left = triKey;
            } else {
              nodes[parentKey].right = triKey;
            }
          } else {
            if (indexes[0] == parentArr[0]) {
              nodes[parentKey].left = triKey;
            } else {
              nodes[parentKey].right = triKey;
            }
          }
        }
      }
    }
    const tris = createTriangleFromIndex(triangles, points, iterOrder);
    let solution = [];
    let maxDepth = 1;
    let start = rootKey;

    // Solution is the edges of the tree
    // Nodes is a dictionary with the index and end index being the key and {"left":null,"right":null,"parent":"1,4","depth":4,"value":"2,4"}
    function bfs() {
      let queue = [start];

      // Create the first edge from the root to first centroid
      let e = createEdge(interiorMap[start].midpoint, tris[start].getCentroid(), -1, -1, 0);
      solution.push(e);
      while (queue.length > 0) {
        let n = queue.shift();
        let node = nodes[n];
        let currEdge = interiorMap[n];
        if (node.left) {
          let neighborEdge = interiorMap[node.left];
          let startPoint = currEdge.midpoint;
          let endPoint = neighborEdge.midpoint;
          if (n in tris) {
            startPoint = tris[n].getCentroid();
          }
          if (node.left in tris) {
            endPoint = tris[node.left].getCentroid();
          }
          let neighborNode = nodes[node.left];
          neighborNode.depth = node.depth + 1;
          maxDepth = Math.max(maxDepth, node.depth + 1);
          let e = createEdge(startPoint, endPoint, -1, -1, node.depth + 1);
          queue.push(node.left);
          solution.push(e);
        }
        if (node.right) {
          let neighborEdge = interiorMap[node.right];
          let startPoint = currEdge.midpoint;
          let endPoint = neighborEdge.midpoint;
          if (n in tris) {
            startPoint = tris[n].getCentroid();
          }
          if (node.right in tris) {
            endPoint = tris[node.right].getCentroid();
          }
          let neighborNode = nodes[node.right];
          neighborNode.depth = node.depth + 1;
          maxDepth = Math.max(maxDepth, node.depth + 1);
          let e = createEdge(startPoint, endPoint, -1, -1, node.depth + 1);
          queue.push(node.right);
          solution.push(e);
        }
      }
    }
    bfs();
    return {
      solution,
      maxDepth,
      nodes,
      triangles: tris
    };
  };
  const getCodewordEdges = (points, codeword) => {
    const N = points.length;
    const getWrapIndex = idxFunction(N);
    const fillCrossings = (crossings, start, end) => {
      for (let i = start + 1; i < end; i++) {
        crossings[getWrapIndex(i)] = true;
      }
    };
    const findCodeEdges = (crossings, point, code) => {
      // Offset by 2 vertices since edges cannot be next to each other
      let edgePoint = point + 2;
      let edges = [];
      while (code > 0) {
        let ind = getWrapIndex(edgePoint);
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
    let all_edges = [];
    let crossings = new Array(N).fill(false);
    let startIndex = codeword.length - 1;
    for (let i = startIndex; i >= 0; i--) {
      let code = codeword[i];
      let edges = findCodeEdges(crossings, i, code);
      for (let j = 0; j < edges.length; j++) {
        let edge = edges[j];
        let p1 = points[i];
        let p2 = points[edge];
        let e = createEdge(p1, p2, i, edge);
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
  const centroid = (p1, p2, p3) => {
    const x = (p1.x + p2.x + p3.x) / 3;
    const y = (p1.y + p2.y + p3.y) / 3;
    const centroid = {
      x,
      y
    };
    return centroid;
  };

  /**
   * @param {number[][]} triIndexes The triangle represented by the edge indexes
   * [[1, 2], [2, 3], [3, 1]] 
   * @param {Point[]} points The list of points of an N-gon
   * @return {Triangle[]} The centroid
   */
  const createTriangleFromIndex = (triIndexes, points, iterOrder) => {
    let triangles = {};
    for (let i = 0; i < iterOrder.length; i++) {
      const currEdge = iterOrder[i];
      const triangleIndexes = triIndexes[i];
      let indexSet = new Set();
      for (let j = 0; j < triangleIndexes.length; j++) {
        const indexes = triangleIndexes[j];
        indexSet.add(indexes[0]);
        indexSet.add(indexes[1]);
      }
      let arr = Array.from(indexSet);
      let p1 = points[arr[0]];
      let p2 = points[arr[1]];
      let p3 = points[arr[2]];
      let tri = createTriangle(p1, p2, p3);
      triangles[currEdge] = tri;
    }
    return triangles;
  };

  /**
   * @typedef {Object} Triangle 
   * @param {Point} p1
   * @param {Point} p2
   * @param {Point} p3
   * @return {Triangle}
   */
  const createTriangle = (p1, p2, p3) => {
    return {
      p1,
      p2,
      p3,
      getCentroid: () => centroid(p1, p2, p3)
    };
  };

  // 20020, 10120
  // 2,0,1,0, 1,0,2,0

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
      let {
        start_idx,
        end_idx
      } = e1[i];
      let key = "" + start_idx + end_idx;
      idxDict[key] = i;
    }
    let count = 0;
    let unused = null;
    for (let j = 0; j < e2.length; j++) {
      let {
        start_idx,
        end_idx
      } = e2[j];
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
  const polygon = () => {
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
    const listeners = d3$1.dispatch("animstart", "animend");
    const my = selection => {
      let points = createPolygonPoints(N, radius, margin.left, margin.top);
      let polygonEdges = createPolygonEdges(points);
      let interiorEdges = getCodewordEdges(points, codeword);

      // NOTE: This code is very dangerous, refactor later
      if (lastEdges != null) {
        interiorEdges = positionEdges(lastEdges, interiorEdges);
      }
      treePath = [];
      let triangles = [];
      if (interiorEdges) {
        let treeInfo = createTriangles(codeword, polygonEdges, interiorEdges, points);
        treePath = treeInfo.solution;
        treeInfo.maxDepth;
        nodes = treeInfo.nodes;
        triangles = Object.values(treeInfo.triangles);
      }
      lastEdges = interiorEdges;
      const t = d3$1.transition().duration(transDuration);
      const pointLine = d3$1.line().x(d => d.x).y(d => d.y);
      const positionLines = lines => {
        lines.attr("x1", d => d.p1.x).attr("y1", d => d.p1.y).attr("x2", d => d.p2.x).attr("y2", d => d.p2.y);
      };
      const initializeRadius = circles => {
        circles.attr("r", 0);
      };
      const growRadius = (enter, color) => {
        enter.transition(t).attr("r", pointSize).attr("fill", color);
      };
      const positionCircles = circles => {
        circles.attr("cx", d => d.x).attr("cy", d => d.y);
      };
      const enterCircles = (circles, color) => {
        circles.call(positionCircles).call(initializeRadius).call(growRadius, color);
      };
      const positionText = text => {
        text.attr("x", (_, i) => points[i].x - 3 + points[i].ux * 15).attr("y", (_, i) => points[i].y + 6 + points[i].uy * 15);
      };
      const calculateDashArr = edge => {
        let dashLength = dash.split(/[\s,]/).map(a => parseFloat(a) || 0).reduce((a, b) => a + b);
        let dashCount = Math.ceil(edge.dist / dashLength);
        let newDashes = new Array(dashCount).join(dash + " ");
        let dashArray = newDashes + " 0, " + edge.dist;
        return dashArray;
      };
      const exitLines = lines => {
        lines.attr("x1", _ => 0).attr("y1", _ => 0).attr("x2", _ => 0).attr("y2", _ => 0);
      };
      selection.selectAll(".vertex-label").data(codeword).join(enter => {
        enter.append("text").attr("class", "vertex-label").attr("opacity", "0.0").attr("font-size", fontSize).call(positionText).transition(t).attr("opacity", "1.0").text(d => d);

        // });
      }, update => update.call(update => update
      // .attr("opacity", "0.0")
      .transition(t)
      // .attr("font-size", fontSize)
      // .attr("opacity", "1.0")
      .text(d => d).call(positionText)), exit => exit.transition(t).attr("opacity", "0.0").remove());
      // .attr("opacity", "0.0")
      // .transition(t)
      // .attr("opacity", "1.0")
      // .text((d, i) => {
      //   if (codeword[i] != null) {
      //     return codeword[i].toString()
      //   }            
      // })

      selection.select("#poly-nodes").selectAll(".edge-node").data(polygonEdges.map(e => e.midpoint).slice(0, -1)).join(enter => enter.append("circle").attr("class", "edge-node").call(enterCircles, interp(7 / 11)), update => update.call(update => update.transition(t).call(positionCircles)), exit => exit.transition(t).call(initializeRadius).remove());
      selection.select("#poly-nodes").selectAll(".root").data(polygonEdges.map(e => e.midpoint).slice(-1)).join(enter => enter.append("circle").attr("class", "root").call(enterCircles, "black"), update => update.call(update => update.transition(t).call(positionCircles)), exit => exit.transition(t).call(initializeRadius).remove());
      selection.select("#poly-nodes").selectAll(".vertex").data(points).join(enter => enter.append("circle").attr("class", "vertex").call(enterCircles, pointColor), update => update.call(update => update.transition(t).call(positionCircles)), exit => exit.transition(t).call(initializeRadius).remove());
      selection.select("#poly-links").selectAll(".polygon-lines").data(polygonEdges).join(enter => enter.append("line").attr("class", "polygon-lines").attr("stroke-opacity", "0.0").transition(t).on("start", () => {
        listeners.call("animstart", null);
      }).on("end", () => {
        listeners.call("animend", null);
      }).attr("stroke-opacity", "1.0").call(positionLines), update => update.call(update => update.transition(t).call(positionLines)), exit => exit.transition(t).on("start", () => {
        listeners.call("animstart", null);
      }).on("end", () => {
        listeners.call("animend", null);
      }).attr("stroke-opacity", "0.0").call(exitLines).remove()).attr("stroke", color).attr("stroke-width", strokeWidth);
      selection.select("#poly-interior-links").selectAll(".tree-path").data(treePath).join(enter => {
        enter.append("path").attr("class", "tree-path").attr("stroke-width", strokeWidth).attr("d", d => pointLine([d.p1, d.p2])).attr("stroke", d => treeInterp(1 - d.depth / 11)) // 11 is the max N
        .attr("opacity", "0.0").transition().delay((d, _) => interiorEdges.length * drawDelay + d.depth * drawDelay)
        // .on("end", (event) => {
        //   listeners.call("interioredgedraw", null);
        // })
        .attr("stroke-dasharray", d => calculateDashArr(d)).attr("stroke-dashoffset", d => d.dist).transition().attr("stroke-opacity", "1.0").duration(1000).attr("opacity", "1").attr("stroke-dashoffset", 0).end().then(() => {
          listeners.call("animend", null);
          // finishedAnimating = true
        });
        // .catch(() => {
        //   listeners.call("animend", null);
        // })
      }, update => {
        update.call(update => {
          update.attr("stroke-dasharray", dash).attr("stroke-dashoffset", null).transition(t).attr("stroke", d => treeInterp(1 - d.depth / 11)).attr("d", d => pointLine([d.p1, d.p2]));
        });
      }, exit => {
        exit.transition(t).attr("stroke-opacity", "0.0").call(exitLines).remove();
      });
      selection.select("#poly-links").selectAll(".interior").data(interiorEdges).join(enter => {
        enter.append("path").attr("class", "interior").attr("stroke-width", strokeWidth).attr("d", d => pointLine([d.p1, d.p2])).attr("stroke", d => interp(d.start_idx / interiorEdges.length)).attr("opacity", "0.0").transition().on("start", () => {
          listeners.call("animstart", null);
        }).delay((_, i) => i * drawDelay)
        // .on("end", (_) => {
        //   console.log("draw edge")
        // listeners.call("end", null);
        // })
        .attr("stroke-dasharray", d => d.dist + " " + d.dist).attr("stroke-dashoffset", d => d.dist).transition().attr("stroke-opacity", "1.0").duration(1000).attr("opacity", "1").attr("stroke-dashoffset", 0);
      }, update => {
        update.call(update => {
          update.attr("stroke-dasharray", null).attr("stroke-dashoffset", null).transition(t).attr("stroke", d => interp(d.start_idx / interiorEdges.length)).attr("d", d => pointLine([d.p1, d.p2]));
        });
      }, exit => {
        exit.transition(t).attr("stroke-opacity", "0.0").call(exitLines).remove();
      });

      // TODO
      selection.selectAll(".interiorVertex").data(triangles.map(tri => ({
        x: tri.getCentroid().x,
        y: tri.getCentroid().y,
        start_idx: 0
      }))).join(enter => enter.append("circle").attr("class", "interiorVertex").transition().delay((_, i) => i * drawDelay).call(positionCircles).call(initializeRadius).transition(t).attr("r", pointSize).attr("fill", d => interp(3 / 11)), update => update.call(update => update.transition(t).call(positionCircles).attr("fill", d => interp(3 / 11))), exit => exit.transition(t).call(initializeRadius).remove());
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
      return arguments.length ? (codeword = _, my) : codeword;
    };
    my.color = function (_) {
      return arguments.length ? (color = _, my) : color;
    };
    my.radius = function (_) {
      return arguments.length ? (radius = _, my) : radius;
    };
    my.pointSize = function (_) {
      return arguments.length ? (pointSize = _, my) : pointSize;
    };
    my.pointColor = function (_) {
      return arguments.length ? (pointColor = _, my) : pointColor;
    };
    my.N = function (_) {
      return arguments.length ? (N = _, my) : N;
    };
    my.reset = function () {
      lastEdges = null;
      codeword = [];
      return my;
    };
    my.margin = function (_) {
      return arguments.length ? (margin = _, my) : margin;
    };
    my.strokeWidth = function (_) {
      return arguments.length ? (strokeWidth = _, my) : strokeWidth;
    };
    my.dash = function (_) {
      return arguments.length ? (dash = _, my) : dash;
    };
    my.fontSize = function (_) {
      return arguments.length ? (fontSize = _, my) : fontSize;
    };
    my.interp = function (_) {
      return arguments.length ? (interp = _, my) : interp;
    };
    my.treeInterp = function (_) {
      return arguments.length ? (treeInterp = _, my) : treeInterp;
    };
    my.drawDelay = function (_) {
      return arguments.length ? (drawDelay = _, my) : drawDelay;
    };
    my.transDuration = function (_) {
      return arguments.length ? (transDuration = _, my) : transDuration;
    };
    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };
    my.nodes = function () {
      if (nodes) {
        return nodes;
      } else {
        return [];
      }
    };
    my.treePath = function () {
      return treePath;
    };
    return my;
  };

  // Credits to Curran Kelleher!
  const menu = () => {
    let id;
    let labelText;
    let options;
    const listeners = d3$1.dispatch('change', 'focus');
    const my = selection => {
      selection.selectAll('label').data([null]).join('label').attr('for', id).text(labelText);
      selection.selectAll('select').data([null]).join('select').attr('id', id).on('change', event => {
        listeners.call('change', null, event.target.value);
      }).on('focus', event => {
        listeners.call('focus', null);
      }).selectAll('option').data(options).join('option').attr('value', d => d.value).text(d => d.text);
    };
    my.id = function (_) {
      return arguments.length ? (id = _, my) : id;
    };
    my.labelText = function (_) {
      return arguments.length ? (labelText = _, my) : labelText;
    };
    my.options = function (_) {
      return arguments.length ? (options = _, my) : options;
    };
    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };
    return my;
  };

  const input = () => {
    let id;
    let placeholder;
    const listeners = d3$1.dispatch("confirm", "focusout");
    const my = selection => {
      selection.selectAll("input").data([null]).join("input").attr("placeholder", placeholder).attr("id", id).on("focusout", e => {
        listeners.call("focusout", null, e.target.value);
      }).on("keyup", e => {
        if (e.key == "Enter") {
          listeners.call("confirm", null, e.target.value);
        }
      });
    };
    my.id = function (_) {
      return arguments.length ? (id = _, my) : id;
    };
    my.placeholder = function (_) {
      return arguments.length ? (placeholder = _, my) : placeholder;
    };
    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };
    return my;
  };

  const button = () => {
    let id;
    let labelText;
    const listeners = d3$1.dispatch('click');
    const my = selection => {
      selection.selectAll('button').data([null]).join('button').attr('id', id).text(labelText).on('click', () => {
        listeners.call('click', null);
      });
    };
    my.id = function (_) {
      return arguments.length ? (id = _, my) : id;
    };
    my.labelText = function (_) {
      return arguments.length ? (labelText = _, my) : labelText;
    };
    my.on = function () {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? my : value;
    };
    return my;
  };

  const tree = () => {
    let width;
    let height;
    let margin;
    let nodes; // Dictionary of nodes 
    let N;
    let transDuration;
    let treeInterp;
    let interp;
    let points;
    let maxXTransform;
    let nodeSize;
    const my = selection => {
      const t = d3$1.transition().duration(transDuration);
      const tree = d3.cluster().nodeSize([11, 14]);
      // .size([width, height])
      // .nodeSize([20, 20])
      // .separation((a, b) => {
      //   return (a.parent == b.parent ? 1 : 10)
      // })

      const initializeRadius = circles => {
        circles.attr("r", 0);
      };

      // const growRadius = (enter, color) => {
      //   enter.transition(t).attr("r", nodeSize).attr("fill", color);
      // };

      const positionCircles = circles => {
        circles.attr("cx", d => d.x).attr("cy", d => d.y);
      };
      const rootKey = `${N - 1},0`;
      let links = [];
      let n = [];
      if (nodes && rootKey in nodes) {
        const root = d3.hierarchy(nodes[rootKey], d => {
          d.children = [];
          if (d.left) {
            d.children.push(nodes[d.left]);
          }
          if (d.right) {
            d.children.push(nodes[d.right]);
          }
          return d.children;
        });
        const treeData = tree(root);
        // treeData.y = treeData.y + 20

        n = treeData.descendants();
        for (let i = 0; i < n.length; i++) {
          n[i].x = n[i].x + 17 * N;
          n[i].y = n[i].y + 80;
        }
        n[0].y = n[0].y - N * 5;
        links = treeData.descendants().slice(1);
      }
      selection.selectAll('line.link').data(links).join(enter => {
        enter.append('line').attr('class', 'link').attr('data-value', d => d.data.value).attr('stroke-width', 2).attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0).transition(t).attr('x1', d => d.parent.x).attr('y1', d => d.parent.y).attr('x2', d => d.x).attr('y2', d => d.y).attr("stroke", d => treeInterp(1 - d.depth / 11));
      }, update => {
        update.transition(t).attr('x1', d => d.parent.x).attr('y1', d => d.parent.y).attr('x2', d => d.x).attr('y2', d => d.y).attr("stroke", d => treeInterp(1 - d.depth / 11));
      }, exit => {
        exit.transition(t).attr("stroke-width", "0.0").remove();
      });
      selection.selectAll(".real-tree-node").data(n).join(enter => enter.append("circle").attr('data-value', d => {
        return d.data.value;
      }).attr("class", "real-tree-node").attr("opacity", "0.0").attr("fill", d => {
        return d.data.leaf ? interp(7 / 11) : interp(3 / 11);
      }).call(initializeRadius).transition(t).call(positionCircles).attr("r", nodeSize).attr("opacity", "1.0"), update => update.call(update => update.transition(t).call(positionCircles).attr("fill", d => d.data.leaf ? interp(7 / 11) : interp(3 / 11))), exit => exit.transition(t).call(initializeRadius).remove());
    };
    my.width = function (_) {
      return arguments.length ? (width = _, my) : width;
    };
    my.height = function (_) {
      return arguments.length ? (height = _, my) : height;
    };
    my.margin = function (_) {
      return arguments.length ? (margin = _, my) : margin;
    };
    my.nodes = function (_) {
      return arguments.length ? (nodes = _, my) : nodes;
    };
    my.N = function (_) {
      return arguments.length ? (N = _, my) : N;
    };
    my.transDuration = function (_) {
      return arguments.length ? (transDuration = _, my) : transDuration;
    };
    my.interp = function (_) {
      return arguments.length ? (interp = _, my) : interp;
    };
    my.treeInterp = function (_) {
      return arguments.length ? (treeInterp = _, my) : treeInterp;
    };
    my.points = function (_) {
      return arguments.length ? (points = _, my) : points;
    };
    my.reset = function () {
      nodes = {};
      points = [];
      N = null;
      return my;
    };
    my.update = function (poly) {
      nodes = poly.nodes();
      points = poly.treePath();
      N = poly.N();
      return my;
    };
    my.maxXTransform = function (_) {
      return arguments.length ? (maxXTransform = _, my) : maxXTransform;
    };
    my.nodeSize = function (_) {
      return arguments.length ? (nodeSize = _, my) : nodeSize;
    };
    return my;
  };

  const MAP_HEIGHT = 2;

  /**
   * Sum up all of the elements of the array starting
   * at index i
   * @param {list} arr Array
   * @param {int} idx Start index
   */
  function arrsum(arr, idx) {
    let res = 0;
    for (let i = idx; i < arr.length; i++) {
      res += arr[i];
    }
    return res;
  }

  /**
   * Make a comma separated string out of an array
   * 
   * @param {list} arr Array
   * @param {str} sep Separator
   */
  function arrstr(arr, sep) {
    let s = "";
    if (sep == undefined) {
      sep = "";
    }
    for (let i = 0; i < arr.length; i++) {
      s += arr[i];
      if (i < arr.length - 1) {
        s += sep;
      }
    }
    return s;
  }

  /**
   * Search for an array in an array of arrays
   * @param {array of arrays} arr Array of arrays
   * @param {array} inarr Array we're searching for
   */
  function arrInArr(arr, inarr) {
    let found = false;
    for (let i = 0; i < arr.length; i++) {
      let equals = arr[i].length == inarr.length;
      if (equals) {
        for (let k = 0; k < arr[i].length; k++) {
          equals = equals && arr[i][k] == inarr[k];
        }
        found = found || equals;
      }
    }
    return found;
  }
  class Codeword {
    constructor(w) {
      this.w = new Int32Array(w);
    }

    /**
     * Extract the internal edges from the codeword
     * @param {int} min_idx Minimum index at which to start
     * throwing down edges
     * @returns 
     */
    get_edges(min_idx) {
      if (min_idx === undefined) {
        min_idx = 0;
      }
      const w = this.w;
      const N = w.length;
      const visible = new Int32Array(N + 2);
      for (let k = 0; k < N + 2; k++) {
        visible[k] = 1;
      }
      let i = N - 1;
      let edges = [];
      while (i >= min_idx) {
        let wi = w[i];
        let j = i + 2;
        while (wi > 0) {
          // Find closest visible vertex
          while (j < N + 2 && visible[j] == 0) {
            j += 1;
          }
          edges.push([i, j]);
          for (let k = i + 1; k < j; k++) {
            visible[k] = 0;
          }
          wi -= 1;
          j += 1;
        }
        i -= 1;
      }
      return edges;
    }

    /**
     * @param {svg Element} g SVG element on which to draw this
     * @param {float} d Diameter of circle in which the polygon is inscribed
     * @param {list of [float, float]} c  Center of circle in which the polygon is inscribed
     * @param {object} options 
     *  {
            show_codeword: bool
                If True, show codeword values at vertices (default True)
            min_idx: int
                Minimum index from which to draw edges or numbers
            bold_idxs: set
                Bold the indices in this set (useful for stacks)
            bold_color
                Color to draw bolded items
            color:
                Color to draw polygon (default 'k')
            circled_vertices: list of int
                Indices of vertices to circle
            dotted_edges: list of [int, int]
                Edges to draw dotted (not necessarily in the triangulation)
            dotted_color: 
                Color to draw dotted edges if they exist
            draw_index: bool
                If True, draw indices instead of values
            stroke_width: float
                With of edges
        }
     */
    draw(g, d, c, options) {
      if (options == undefined) {
        options = {};
      }
      if (!("show_codeword" in options)) {
        options["show_codeword"] = true;
      }
      if (!("min_idx" in options)) {
        options["min_idx"] = 0;
      }
      if (!("bold_idxs" in options)) {
        options["bold_idxs"] = [];
      }
      if (!("bold_color" in options)) {
        options["bold_color"] = d3.rgb(255, 128, 12);
      }
      if (!("color" in options)) {
        options["color"] = d3.rgb(0, 0, 0);
      }
      if (!("circled_vertices" in options)) {
        options["circled_vertices"] = [];
      }
      if (!("dotted_edges" in options)) {
        options["dotted_edges"] = [];
      }
      if (!("dotted_color" in options)) {
        options["dotted_color"] = d3.rgb(0, 0, 0);
      }
      if (!("draw_index" in options)) {
        options["draw_index"] = false;
      }
      if (!("stroke_width" in options)) {
        options["stroke_width"] = 2.5;
      }
      const stroke_width = options["stroke_width"];

      // Step 1: Draw polygon boundary
      const min_idx = options["min_idx"];
      const r = d / 2;
      const w = this.w;
      const N = w.length;
      const dTheta = 2 * Math.PI / (N + 2);
      let theta = Math.PI / 2 + Math.PI / (N + 2);
      let Xx = [];
      let Tx = [];
      let Xy = [];
      let Ty = [];
      for (let i = 0; i < N + 3; i++) {
        const x = r * Math.cos(theta) + c[0];
        const y = -r * Math.sin(theta) + c[1];
        Xx.push(x);
        Xy.push(y);
        Tx.push(r * 1.25 * Math.cos(theta) + c[0]);
        Ty.push(-r * 1.25 * Math.sin(theta) + c[1]);
        if (options["circled_vertices"].includes(i)) {
          g.append("circle").attr("r", 10).attr("fill", "none").attr("stroke", "red").attr("stroke-width", 1.5).attr("cx", Tx[i]).attr("cy", Ty[i]);
        }
        g.append("circle").attr("r", 5).attr("fill", options["color"]).attr("cx", x).attr("cy", y);
        theta += dTheta;
      }
      let rg = N;
      if (options["draw_index"]) {
        rg = N + 2;
      }
      if (options["show_codeword"]) {
        for (let i = 0; i < rg; i++) {
          if (i >= min_idx) {
            let c = options["color"];
            let font_weight = 100;
            if (options["bold_idxs"].includes(i)) {
              c = options["bold_color"];
              font_weight = 700;
            }
            let val = i;
            if (!options["draw_index"]) {
              val = w[i];
            }
            g.append("text").attr("x", Tx[i]).attr("y", Ty[i]).attr("text-anchor", "middle").attr("dy", 5).attr("fill", c).style("font-weight", font_weight).text("" + val);
          }
        }
      }

      // Step 2: Draw polygon edges
      // Step 2a: Boundary edges
      for (let i = 0; i < N + 2; i++) {
        g.append("line").attr("x1", Xx[i]).attr("y1", Xy[i]).attr("x2", Xx[i + 1]).attr("y2", Xy[i + 1]).attr("stroke", options["color"]).attr("stroke-width", stroke_width);
      }
      // Step 2b: Internal edges
      const edges = this.get_edges(min_idx);
      for (let k = 0; k < edges.length; k++) {
        let e = edges[k];
        const i = e[0];
        const j = e[1];
        g.append("line").attr("x1", Xx[i]).attr("y1", Xy[i]).attr("x2", Xx[j]).attr("y2", Xy[j]).attr("stroke", options["color"]).attr("stroke-width", stroke_width);
      }

      // Step 3: Draw any dotted edges
      for (let idx = 0; idx < options["dotted_edges"].length; idx++) {
        const e = options["dotted_edges"][idx];
        const i = e[0];
        const j = e[1];
        g.append("line").attr("x1", Xx[i]).attr("y1", Xy[i]).attr("x2", Xx[j]).attr("y2", Xy[j]).attr("stroke", options["dotted_color"]).attr("stroke-width", stroke_width).style("stroke-dasharray", "10, 5");
      }
    }
  }
  class Associahedron {
    /**
     * 
     * @param {int} n 
     * @param {object} opts 
        {
            "diameter": How big each polygon is,
            "g_x_offset": Global x offset
            "g_y_offset": Global y offset
            "show_circle": Whether to show the dotted circle around where we are
            "show_map": Whether to show the reversal map
        }
     * @param {string} domStr ID of the DOM element to fill with this
     */
    constructor(n, opts, domStr) {
      if (opts == undefined) {
        opts = {};
      }
      if (!("diameter" in opts)) {
        opts["diameter"] = 100;
      }
      if (!("g_x_offset" in opts)) {
        opts["g_x_offset"] = opts["diameter"] * n * 1.5;
      }
      if (!("g_y_offset" in opts)) {
        opts["g_y_offset"] = 40;
      }
      if (!("show_circle" in opts)) {
        opts["show_circle"] = false;
      }
      if (!("show_map" in opts)) {
        opts["show_map"] = false;
      }
      this.n = n;
      const diam = opts["diameter"];
      this.diam = diam;
      this.g_x_offset = opts["g_x_offset"];
      this.g_y_offset = opts["g_y_offset"];

      // Step 1: Setup container and canvas
      const container = document.getElementById(domStr);
      container.addEventListener("contextmenu", e => e.preventDefault());
      this.width = window.innerWidth * 0.9;
      this.height = window.innerHeight * 0.9;
      this.container = container;
      this.text = document.createElement("h4");
      this.container.appendChild(this.text);
      let canvasDOM = document.createElement("div");
      canvasDOM.id = domStr + "_Canvas";
      container.appendChild(canvasDOM);
      this.canvas = d3.select("#" + domStr + "_Canvas").append("svg").attr("width", this.width).attr("height", this.height).call(d3.drag().on("drag", this.dragNode.bind(this)));
      // .attr("style", "border-style: dotted;");
      this.container.obj = this;
      // Clear all graph elements if any exist
      this.canvas.selectAll("*").remove();
      this.g = this.canvas.append("g");
      this.xoffset = 0;
      this.yoffset = 0;
      if (opts["show_circle"]) {
        const cg = this.canvas.append("g");
        cg.append("circle").attr("r", 0.9 * diam).attr("fill", "none").attr("stroke", "black").attr("stroke-width", 3).style("stroke-dasharray", "10, 5").attr("cx", opts["g_x_offset"] - 1.5 * diam * (n - 2)).attr("cy", opts["g_y_offset"] + diam * 0.6);
      }
      this.show_map = false;
      if (opts["show_map"]) {
        this.mg = this.canvas.append("g");
        this.show_map = true;
      }
      this.w = new Int32Array(n);
      this.stack_index = new Int32Array(n);
      this.codewords = [];
      this.last_codeword = null;
      this.codeword_obj = {};
      this.make_stack_rec(this.w, n - 1, this.g_x_offset, this.g_y_offset, opts, this.g);
      if (this.show_map) {
        this.initializeMap();
      }
      this.resetAnimation();
    }
    resetAnimation() {
      this.animIndex = 0;
    }
    finishedAnimation() {
      return this.animIndex >= this.codewords.length - 1;
    }

    /**
     * 
     * @param {float} moveTime Animation timestep, in milliseconds
     * @returns 
     */
    async moveToNext(moveTime) {
      if (this.finishedAnimation()) {
        return;
      }
      const c1 = this.codewords[this.animIndex];
      const s1 = c1.s;
      this.animIndex += 1;
      const c2 = this.codewords[this.animIndex];
      const s2 = c2.s;

      // First check if we're jumping to a new stack
      let newStack = false;
      let i = s1.length - 1;
      while (i >= 0 && !newStack) {
        if (s1[i] != s2[i]) {
          newStack = true;
        } else {
          i--;
        }
      }
      let x = 0;
      const y = -c2.y + 0.065 * this.diam * this.n;
      let message = "";
      if (newStack) {
        message = "Jumping to a new stack of dimension";

        // this.text.innerHTML = "Moving to new stack of dimension " + i;
        // message += " where w["+(i+1)+"] = " + c2.c.w[i+1];
        // if (s2[i]%2 == 0) {
        //     message += " and where w["+i+"] goes down in reverse from " + c2.c.w[i];
        // }

        // else {
        //     message += " and where w["+i+"] goes up from " + c2.c.w[i];
        // }

        x = -this.diam * i * 1.5;
        this.g.transition().duration(moveTime * 2).attr("transform", "translate(" + x + "," + y + ")");
        await new Promise(resolve => {
          setTimeout(() => resolve(), moveTime * 2);
        });
        x = 0;
      }
      if (message != "") {
        d3.select("#reverse-text").text(message);
        d3.select("#dim-stack").text(i);
        setTimeout(() => {
          d3.select("#reverse-text").text(" ");
        }, 5000);
        setTimeout(() => {
          d3.select("#dim-stack").text(" ");
        }, 5000);
      }
      // this.text.innerHTML = arrstr(c2.c.w);
      this.xoffset = x;
      this.yoffset = y;
      this.updateMap();
      this.g.transition().duration(moveTime).attr("transform", "translate(0," + y + ")");
      await new Promise(resolve => {
        setTimeout(() => resolve(), moveTime);
      });
    }

    /**
     * @param {string} codeword The codeword to animate to
     * @param {float} moveTime Animation timestep, in milliseconds  
     */
    async animateToCodeword(codeword, moveTime) {
      let position = this.codeword_obj[codeword];
      const y = -position.y + 0.065 * this.diam * this.n;
      this.xoffset = 0;
      this.yoffset = position.y;
      this.updateMap();
      this.g.transition().duration(moveTime).attr("transform", "translate(0," + y + ")");
      await new Promise(resolve => {
        setTimeout(() => resolve(), moveTime);
      });
    }
    updateMap() {
      if (this.show_map) {
        let y = this.height / 2 + this.yoffset * MAP_HEIGHT / (1.5 * this.diam);
        this.mg.attr("transform", "translate(0," + y + ")");
      }
    }
    dragNode() {
      this.xoffset += d3.event.dx;
      this.yoffset += d3.event.dy;
      this.g.attr("transform", "translate(" + this.xoffset + " " + this.yoffset + ")");
      this.updateMap();
    }

    /**
     * React to a mouse down event by adding a node
     */
    mouseDown() {
      d3.mouse(d3.event.currentTarget);
    }

    /**
     * A function which toggles all of the visible elements to show
     */
    show() {
      this.container.style("display", "block");
    }

    /**
     * A function which toggles all of the visible elements to hide
     */
    hide() {
      this.container.style("display", "none");
    }
    initializeMap() {
      const that = this;
      const g = this.mg;
      const width = this.diam / this.n;
      const height = MAP_HEIGHT;
      let y = 0;
      for (let i = 0; i < this.codewords.length; i++) {
        const s = this.codewords[i].s;
        for (let j = 1; j < s.length; j++) {
          let x = this.width - this.diam + j * width;
          let r = g.append("rect").attr("i", i).attr("j", j).attr("x", x).attr("y", y).attr("width", width).attr("height", height).attr("stroke", "none");
          if (s[j] % 2 == 0) {
            r = r.attr("fill", "gray");
          } else {
            r = r.attr("fill", "white");
          }
          r.on("mousedown", function () {
            let xoffset = -(j - 1) * 1.5 * that.diam;
            let yoffset = -i * that.diam * 1.5;
            that.g.attr("transform", "translate(" + xoffset + " " + yoffset + ")");
            that.xoffset = xoffset;
            that.yoffset = yoffset;
            that.updateMap();
          });
        }
        y += height;
      }
      g.append("rect").attr("x", this.width - this.diam + width).attr("y", 0).attr("width", this.diam * (this.n - 2) / this.n).attr("height", MAP_HEIGHT * this.codewords.length).attr("stroke", "black").attr("fill", "none");
      const lg = this.canvas.append("g");
      lg.append("line").attr("x1", this.width - this.diam + width).attr("y1", this.height / 2).attr("x2", this.width - this.diam + width + this.diam * (this.n - 2) / this.n).attr("y2", this.height / 2).attr("stroke", d3.rgb(255, 128, 12)).attr("stroke-width", 2).style("stroke-dasharray", "10, 5");
      this.updateMap();
    }
    make_stack_rec(w, d, g_x_offset, y_offset, opts, g) {
      const n = w.length;
      const diam = opts["diameter"];
      let dy = -0.1 * diam;
      let h = w.length - d - arrsum(w, d + 1) + 1;
      let x_offset = g_x_offset - 1.5 * diam * (n - d - 1);
      g.append("text").attr("x", x_offset).attr("y", y_offset).attr("text-anchor", "middle").text("d = " + d + ", h = " + h, dy = 0.7 * diam);
      let y1 = y_offset - diam / 7;
      let n_items = 0;
      let vals = [];
      if (this.stack_index[d] % 2 == 0) {
        vals = new Int32Array(h).map((_, idx) => idx);
      } else {
        vals = new Int32Array(h).map((_, idx) => h - idx - 1);
      }
      this.stack_index[d] += 1;
      const stackorder = new Int32Array(this.stack_index);
      for (let ival = 0; ival < vals.length; ival++) {
        let val = vals[ival];
        let wi = new Int32Array(w);
        wi[d] = val;
        let ni = 0;
        if (d == 1) {
          // Base case
          wi[0] = n - 1 - arrsum(wi, 1);
          ni = 1;
          let c = new Codeword(wi);
          this.codewords.push({
            "c": c,
            "s": stackorder,
            "x": x_offset,
            "y": y_offset
          });
          this.codeword_obj[arrstr(wi, ",")] = this.codewords[this.codewords.length - 1];
          let dotted_edges = [];
          let circled_vertices = [];
          if (this.codewords.length > 1) {
            // Indicate quad where flip happened
            let e1 = c.get_edges();
            let c2 = this.last_codeword;
            let e2 = c2.get_edges();
            for (let k = 0; k < e2.length; k++) {
              if (!arrInArr(e1, e2[k])) {
                dotted_edges.push(e2[k]);
              }
            }
            for (let k = 0; k < w.length; k++) {
              if (c.w[k] != c2.w[k]) {
                circled_vertices.push(k);
              }
            }
          }
          c.draw(g, diam, [x_offset, y_offset + dy], {
            "bold_idxs": [1],
            "circled_vertices": circled_vertices,
            "dotted_edges": dotted_edges
          });
          let t = g.append("text").attr("x", x_offset - diam - n * diam * 0.07).attr("y", y_offset + dy).attr("text-anchor", "middle");
          for (let k = 0; k < wi.length; k++) {
            t = t.append("tspan");
            if (circled_vertices.includes(k)) {
              t = t.style("font-weight", "700");
            } else {
              t = t.style("font-weight", "100");
            }
            t = t.text("" + wi[k]);
          }
          this.last_codeword = c;
        } else {
          let c = new Codeword(wi);
          c.draw(g, diam, [x_offset, y_offset + dy], {
            "min_idx": d,
            "bold_idxs": [d]
          });
          let s = "";
          for (let k = d; k < wi.length; k++) {
            s += wi[k];
          }
          g.append("text").attr("x", x_offset).attr("y", y_offset - diam / 3.2 + dy).attr("text-anchor", "middle").text(s);
          ni = this.make_stack_rec(wi, d - 1, g_x_offset, y_offset, opts, g);
        }
        n_items += ni;
        y_offset += diam * 1.5 * ni;
      }
      let y2 = y_offset - diam / 7;
      let x1 = x_offset - 1.5 * diam / 2;
      let x2 = x1 + 1.5 * diam;
      let r = g.append("rect").attr("x", x1).attr("y", y1).attr("width", x2 - x1).attr("height", y2 - y1).attr("stroke", "black");
      if (this.stack_index[d] % 2 == 0) {
        r.attr("fill-opacity", "0.3").attr("fill", "gray");
      } else {
        r.attr("fill", "none");
      }
      return n_items;
    }
  }

  // https://gist.github.com/mbostock/1125997
  // https://observablehq.com/@mbostock/scrubber
  // https://stackoverflow.com/questions/23048263/pausing-and-resuming-a-transition
  // http://www.ams.org/publicoutreach/feature-column/fcarc-associahedra

  const margin = {
    top: 20,
    right: 30,
    bottom: 7,
    left: 20
  };
  const treeMargin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };
  const treeWidth = 600;
  const treeHeight = 250;
  const N = 2;
  let codewords = getCodeWords(N);
  const mapCodewords = cws => cws.map(code => ({
    value: code,
    text: code
  }));
  const createCodewordOptions = cws => {
    const noneOption = [{
      value: "none",
      text: "None"
    }];
    const options = noneOption.concat(mapCodewords(cws));
    return options;
  };
  let codeword = [];
  window.innerWidth - margin.left - margin.right;
  const height = window.innerHeight - margin.top - margin.bottom;
  const codewordHeader = d3$1.select("#codeword-text");
  const exploreLink = d3$1.select("#stack-explore-link").text("Click to explore stack for n=2").attr("href", "scrollStack.html?n=2");
  const menuContainer = d3$1.select(".menu-container");
  const polySvg = d3$1.select("#polygon").attr("width", 250).attr("height", height - 490);
  const treeSvg = d3$1.select("#tree").attr("width", 300).attr("height", height - 490);
  const NInputLabel = menuContainer.append("label").text("Type N and press Enter: ");
  const NInput = menuContainer.append("div");
  const codewordMenu = menuContainer.append("div");
  const codewordLabel = menuContainer.append("label").text("Type codeword and press Enter: ");
  const inputButton = menuContainer.append("div");
  menuContainer.append("br");
  const startAnimationButton = menuContainer.append("div").attr("id", "anim-buttons").append("span");
  const restartDrawButton = menuContainer.select("#anim-buttons").append("span");

  // menuContainer.append("hr").attr("color", "#DCDCDC")
  const radius = 100;
  const pointSize = 4;
  const color = "black";
  const pointColor = "black";
  const interp = d3["interpolateViridis"];
  const treeInterp = d3["interpolatePlasma"];
  let animationInter = null;
  let warned = false;
  let endAnimation = false;
  let isAnimating = false;
  function playAnimation(poly, t) {
    if (!isAnimating) {
      isAnimating = true;
      animate(poly, t);
    }
  }
  async function animate(poly, t) {
    function update() {
      let index = associahedron.animIndex;
      let cw = codewords[index];
      polySvg.call(poly.codeword(cw));
      treeSvg.call(t.update(poly));
      d3$1.select("#codeword-menu").property("selectedIndex", index + 1);
      codewordHeader.text(`Codeword: ${cw}`);
    }
    let started = poly.treePath().length == 0;
    await new Promise(resolve => {
      setTimeout(() => resolve(), 1000);
    });
    while (!associahedron.finishedAnimation() && !endAnimation) {
      if (endAnimation) {
        break;
      }
      update();
      let timeout = 0;
      if (started) {
        started = false;
        timeout = 250 * poly.N() + 1000;
      }
      await new Promise(resolve => {
        setTimeout(() => resolve(), Math.max(timeout, 1000));
      });
      if (endAnimation) {
        break;
      }
      await associahedron.moveToNext(1000);
    }
    if (!endAnimation) {
      update();
    }
    isAnimating = false;
  }
  const toggle = disable => {
    d3$1.select("#codeword-menu").property("disabled", disable);
    d3$1.select("#n-menu").property("disabled", disable);
    d3$1.select("#n-input").property("disabled", disable);
    d3$1.select("#start-button").property("disabled", disable);
  };
  let associahedron = new Associahedron(2, {
    "diameter": 100,
    "show_circle": true,
    "show_map": false
  }, "polygon-container");
  function main() {
    const cw = menu().id("codeword-menu").labelText("Codeword:").options(createCodewordOptions(codewords)).on("focus", () => {
      const n = poly.N() - 2;
      if (!codewords.length || codewords[0].length != n) {
        const cws = getCodeWords(n);
        codewords = cws;
        const options = createCodewordOptions(cws);
        d3$1.select("#codeword-menu").property("selectedIndex", -1);
        codewordMenu.call(cw.options(options));
      }
    }).on("change", cw => {
      let parsedCodeword = [];
      if (cw != "none") {
        parsedCodeword = cw.split(",");
      } else {
        poly.reset();
      }
      clearInterval(animationInter);
      polySvg.call(poly.codeword(parsedCodeword));
      codewordHeader.text(`Codeword: ${parsedCodeword}`);
      codewordLabel.text("Type codeword and press Enter:  ").style("color", "black");
      endAnimation = true;
      if (cw != "none") {
        associahedron.animateToCodeword(cw, 1000);
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

    const restartButton = button().labelText("Restart").id("restart-button").on("click", _ => {
      endAnimation = true;
      associahedron.resetAnimation();
      associahedron.animateToCodeword(associahedron.codewords[0].c.w.join(","), 1000);
      polySvg.call(poly.reset());
      treeSvg.call(t.reset());
    });
    const startButton = button().labelText("View Hamiltonian Path").id("start-button").on("click", _ => {
      const n = poly.N() - 2;
      associahedron.resetAnimation();
      associahedron.animateToCodeword(associahedron.codewords[0].c.w.join(","), 1000);
      if (!codewords.length || codewords[0].length != n) {
        const cws = getCodeWords(n);
        codewords = cws;
        const options = createCodewordOptions(cws);
        d3$1.select("#codeword-menu").property("selectedIndex", -1);
        codewordMenu.call(cw.options(options));
      }
      endAnimation = false;
      playAnimation(poly, t);
    });
    const onNConfirm = value => {
      const validationRegex = /^[1-9][0-9]*$/;
      if (validationRegex.test(value)) {
        const n = parseInt(value);
        if (+n + 2 == poly.N()) {
          return;
        }
        if (n >= 2) {
          endAnimation = true;
          // const cws = getCodeWords(n);
          // codewords = cws;
          // const options = createCodewordOptions(cws);
          d3$1.select("#codeword-menu").property("selectedIndex", -1);
          // codewordMenu.call(cw.options(options));
          clearInterval(animationInter);
          poly.reset();
          polySvg.call(poly.N(+n + 2));
          codewordHeader.text(`Codeword: ${[]}`);
          treeSvg.call(t.update(poly));
          NInputLabel.text("Type N and press Enter: ").style("color", "black");
          exploreLink.text("Click to explore stack for n=" + n).attr("href", "scrollStack.html?n=" + n);
          d3.selectAll("#polygon-container_Canvas").remove();
          associahedron = new Associahedron(+n, {
            "diameter": 80,
            "show_circle": true,
            "show_map": false
          }, "polygon-container");
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
    const nInput = input().id("n-input")
    // .placeholder("2, 7, etc")
    .on("focusout", value => {
      onNConfirm(value);
    }).on("confirm", value => {
      onNConfirm(value);
    });
    const onCodewordConfirm = value => {
      value = value.replaceAll(" ", "");
      const validationRegex = /^(\d+,)*\d+$/;
      if (validationRegex.test(value)) {
        const codeword = value.split(",");
        const n = poly.N();
        if (codeword.length == n - 2 && isValidCodeword(codeword, n - 2)) {
          endAnimation = true;
          clearInterval(animationInter);
          polySvg.call(poly.codeword(codeword));
          codewordHeader.text(`Codeword: ${codeword}`);
          treeSvg.call(t.update(poly));
          codewordLabel.text("Type codeword and press Enter: ").style("color", "black");
          associahedron.animateToCodeword(value, 1000);
        } else {
          codewordLabel.text("Invalid codeword.").style("color", "red");
        }
      } else {
        codewordLabel.text("Invalid input.").style("color", "red");
      }
    };
    const codewordInput = input().id("codeword-input").on("focusout", value => {
      onCodewordConfirm(value);
    }).on("confirm", value => {
      onCodewordConfirm(value);
    });
    const poly = polygon().N(N + 2).codeword(codeword).radius(radius).pointSize(pointSize).pointColor(pointColor).strokeWidth(2).color(color).margin(margin).drawDelay(100).transDuration(1000).interp(interp).treeInterp(treeInterp).dash("3, 2").fontSize("16px").on("animstart", _ => toggle(true)).on("animend", _ => toggle(false));
    startAnimationButton.call(startButton);
    restartDrawButton.call(restartButton);
    inputButton.call(codewordInput);
    codewordMenu.call(cw);
    NInput.call(nInput);
    polySvg.call(poly);
    // NMenu.call(nChoiceMenu);

    const t = tree().width(treeWidth).height(treeHeight).nodes({}).margin(treeMargin).transDuration(1000).interp(interp).treeInterp(treeInterp).maxXTransform(50).nodeSize(4);
    treeSvg.call(t);
  }
  main();

})(d3);
//# sourceMappingURL=bundle.js.map
