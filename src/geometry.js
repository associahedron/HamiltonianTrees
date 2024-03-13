import { range } from 'd3'


const formatKey = (start, end) => {
  return `${start},${end}`
}

const keyFromArr = (arr) => {
  return arr.join(',')
}

const parseKey = (key) => {
  return key.split(',').map((v) => +v)
}

const idxFunction = (N) => (idx) => idx % N

const isPolygonEdge = (i1, i2, N) => {
  const getWrapIndex = idxFunction(N)
  return getWrapIndex(i1 + 1) == i2
}

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
    midpoint: { x, y },
    dist,
    start_idx: start,
    end_idx: end,
    getKey: () => `${start},${end}`,
    depth,
  };
};

/**
 * @param {number} N The number of sides
 * @param {number} r The radius of the polygon
 * @param {number} leftOffset The x offset
 * @param {number} topOffset The y offset
 * @return {number[]} A list of vertices for the polygon
 */
export const createPolygonPoints = (N, r, leftOffset, topOffset) => {
  let points = [];
  let inc = (2 * Math.PI) / N;
  for (let i = 0; i < N; i++) {
    let theta = inc * (i + 1) + (Math.PI * 3) / 2 - inc / 2;

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
    let point = { x, y, ux, uy };
    points.push(point);
  }
  points.reverse();
  return points;
};

/**
 * @param {Point[]} points A list of points for an N-gon
 * @return {Edge[]} A list of edges for that N-gon
 */
export const createPolygonEdges = (points) => {
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

export const createTriangles = (codeword, polygonEdges, interiorEdges, points) => {
  if (!interiorEdges.length) return { solution: [], maxDepth: 1, nodes: null, triangles: {}};

  let interiorMap = {};

  let N = polygonEdges.length;
  let interiorN = interiorEdges.length;

  for (let i = 0; i < interiorN; i++) {
    let edge = interiorEdges[i];
    let key = edge.getKey()
    interiorMap[key] = edge;
  }


  for (let i = 0; i < polygonEdges.length; i++) {
    let edge = polygonEdges[i];
    let key = edge.getKey();
    interiorMap[key] = edge;
  }

  const rootKey = `${N - 1},0`
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
      inorderPos: null,
    }
  }

  let triangles = [];

  let crossings = new Array(N).fill(false);

  let polyEdgesUsed = new Array(N).fill(false);

  let used = new Set(range(N));

  let edgeStack = [];
  let startIndex = codeword.length - 1;

  let iterOrder = []

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

        let key = formatKey(point, ind)
        let node = {
          left: null,
          right: null,
          parent: null,
          depth: 0,
          value: key,
          leaf: false,
          inorderPos: null,
        }
        nodes[key] = node;

        let checkRange = range(point, edgePoint).map((e) => getWrapIndex(e));
        for (let j = 0; j < checkRange.length; j++) {
          let edge = checkRange[j];
          // IF the edge is not used, add it to the triangle
          if (!polyEdgesUsed[edge]) {
            polyEdgesUsed[edge] = true;
            
            tri.push([edge, getWrapIndex(edge + 1)]);
            // let childKey = formatKey(edge, getWrapIndex(edge + 1));
            let parentKey = formatKey(point, ind);
            iterOrder.push(parentKey)
            used.delete(edge);
          }
        }
        
        // If we don't make a triangle, then we know we have to use the interior edges
        while (tri.length < 3) {
          let e = edgeStack.pop();
          // let childKey = formatKey(e[0], e[1])
          let parentKey = formatKey(point, ind)
          iterOrder.push(parentKey)
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
  }

  nodes[rootKey] = rootNode;

  // ==== ADD THE LAST TRIANGLE IN THE STACK
  let lastTriangle = [];
  while (edgeStack.length) {
    let e = edgeStack.pop();
    lastTriangle.push(e);
  }

  used.forEach((value) => {
    lastTriangle.push([value, getWrapIndex(value + 1)]);
  });

  triangles.push(lastTriangle);
  iterOrder.push(rootKey)
  triangles.reverse()
  iterOrder.reverse()
  iterOrder = Array.from(new Set(iterOrder))
  for (let i = 0; i < iterOrder.length; i++) {
    let triangleIndexes = triangles[i]

    let parentKey = iterOrder[i]
    let parentArr = parseKey(parentKey)

    for (let j = 0; j < triangleIndexes.length; j++) {
      let indexes = triangleIndexes[j]
      let triKey = keyFromArr(indexes)
      if (triKey == parentKey) {
        continue
      } else {
        nodes[triKey].parent = parentKey;
        if (i == 0) {
          if (indexes[0] == parentArr[1]) {
            nodes[parentKey].left = triKey
          } else {
            nodes[parentKey].right = triKey
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
  const tris = createTriangleFromIndex(triangles, points, iterOrder)
  let solution = [];

  let maxDepth = 1;

  let start = rootKey;

  // Solution is the edges of the tree
  // Nodes is a dictionary with the index and end index being the key and {"left":null,"right":null,"parent":"1,4","depth":4,"value":"2,4"}
  function bfs() {
    let queue = [start];

    // Create the first edge from the root to first centroid
    let e = createEdge(
      interiorMap[start].midpoint,
      tris[start].getCentroid(),
      -1,
      -1,
      0
    );
    solution.push(e);

    while (queue.length > 0) {
      let n = queue.shift();
      let node = nodes[n];
      let currEdge = interiorMap[n];

      if (node.left) {
        let neighborEdge = interiorMap[node.left];

        let startPoint = currEdge.midpoint
        let endPoint = neighborEdge.midpoint

        if (n in tris) {
          startPoint = tris[n].getCentroid()
        }
        if (node.left in tris) {
          endPoint = tris[node.left].getCentroid()
        }
        
        let neighborNode = nodes[node.left];
        neighborNode.depth = node.depth + 1;
        maxDepth = Math.max(maxDepth, node.depth + 1);
        let e = createEdge(
          startPoint,
          endPoint,
          -1,
          -1,
          node.depth + 1
        );
        queue.push(node.left);
        solution.push(e);
      }

      if (node.right) {
        let neighborEdge = interiorMap[node.right];
        let startPoint = currEdge.midpoint
        let endPoint = neighborEdge.midpoint

        if (n in tris) {
          startPoint = tris[n].getCentroid()
        }
        if (node.right in tris) {
          endPoint = tris[node.right].getCentroid()
        }
        
        let neighborNode = nodes[node.right];
        neighborNode.depth = node.depth + 1;
        maxDepth = Math.max(maxDepth, node.depth + 1);
        let e = createEdge(
          startPoint,
          endPoint,
          -1,
          -1,
          node.depth + 1
        );
        queue.push(node.right);
        solution.push(e);
      }
    }
  }

  bfs(nodes, start, 0, interiorMap);
  return { solution, maxDepth, nodes, triangles: tris };
};


export const getCodewordEdges = (points, codeword) => {
  const N = points.length;
  const getWrapIndex = idxFunction(N)

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
  const x = (p1.x + p2.x + p3.x) / 3
  const y = (p1.y + p2.y + p3.y) / 3
  const centroid = { x, y }
  return centroid
};


/**
 * @param {number[][]} triIndexes The triangle represented by the edge indexes
 * [[1, 2], [2, 3], [3, 1]] 
 * @param {Point[]} points The list of points of an N-gon
 * @return {Triangle[]} The centroid
 */
const createTriangleFromIndex = (triIndexes, points, iterOrder) => {
  let triangles = {}
  for (let i = 0; i < iterOrder.length; i++) {
    const currEdge = iterOrder[i]
    const triangleIndexes = triIndexes[i]
    let indexSet = new Set()
    for (let j = 0; j < triangleIndexes.length; j++) {

      const indexes = triangleIndexes[j]
      indexSet.add(indexes[0])
      indexSet.add(indexes[1])
    }

    let arr = Array.from(indexSet)
    let p1 = points[arr[0]]
    let p2 = points[arr[1]]
    let p3 = points[arr[2]]
    let tri = createTriangle(p1, p2, p3)
    triangles[currEdge] = tri
  }

  return triangles
}


/**
 * @typedef {Object} Triangle 
 * @param {Point} p1
 * @param {Point} p2
 * @param {Point} p3
 * @return {Triangle}
 */
const createTriangle = (p1, p2, p3) => {
  return {
    p1, p2, p3,
    getCentroid: () => centroid(p1, p2, p3)
  }
}
