import { range } from 'd3'

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

    let point = { x, y, ux, uy };
    points.push(point);
  }
  points.reverse();
  return points;
};

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

export const createTriangles = (codeword, polygonEdges, interiorEdges) => {
  if (!interiorEdges.length) return { solution: [], maxDepth: 1 };

  let interiorMap = {};

  let N = polygonEdges.length;
  let interiorN = interiorEdges.length;

  let rootKey = `${N - 1},0`

  for (let i = 0; i < interiorN; i++) {
    let edge = interiorEdges[i];
    let key = edge.getKey()
    interiorMap[key] = edge;
  }
  interiorMap[rootKey] = polygonEdges[N - 1];

  const formatKey = (start, end) => {
    return `${start},${end}`
  }
  const getWrapIndex = (idx) => idx % N;
  const fillCrossings = (crossings, start, end) => {
    for (let i = start + 1; i < end; i++) {
      crossings[getWrapIndex(i)] = true;
    }
  };

  let nodes = {};
  let triangles = [];

  let crossings = new Array(N).fill(false);
  let polyEdgesUsed = new Array(N).fill(false);
  let used = new Set(range(N));

  let edgeStack = [];
  let startIndex = codeword.length - 1;
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

        let node = {}
        node.left = null;
        node.right = null;
        node.parent = null;
        node.depth = 0;
        let key = formatKey(point, ind)
        node.value = key;
        nodes[key] = node;

        let checkRange = range(point, edgePoint).map((e) => getWrapIndex(e));
        for (let j = 0; j < checkRange.length; j++) {
          let edge = checkRange[j];
          if (!polyEdgesUsed[edge]) {
            polyEdgesUsed[edge] = true;
            tri.push([edge, getWrapIndex(edge + 1)]);
            used.delete(edge);
          }
        }

        while (tri.length < 3) {
          let e = edgeStack.pop();
          let childKey = formatKey(e[0], e[1])
          let parentKey = formatKey(point, ind)
          nodes[childKey].parent = parentKey;
          
          if (point == e[0]) {
            nodes[parentKey].left = childKey
          } else {
            nodes[parentKey].right = childKey;
          }
          tri.push(e);
        }

        triangles.push(tri);

        edgeStack.push([point, ind]);
      }
      edgePoint++;
    }
  }

  let rootNode = {}
  rootNode.left = null;
  rootNode.right = null;
  rootNode.parent = null;
  rootNode.value = rootKey;
  rootNode.depth = 0;
  nodes[rootKey] = rootNode;

  let lastTriangle = [];
  while (edgeStack.length) {
    let e = edgeStack.pop();
    let childKey = formatKey(e[0], e[1])
    let parentKey = rootKey

    nodes[childKey].parent = parentKey;

    if (0 == e[0]) {
      nodes[rootKey].left = childKey;
    } else {
      nodes[rootKey].right = childKey;
    }

    lastTriangle.push(e);
  }

  used.forEach((value) => {
    lastTriangle.push([value, getWrapIndex(value + 1)]);
  });

  triangles.push(lastTriangle);

  let solution = [];
  let start = rootKey;

  let maxDepth = 1;

  // TODO CHECK THE LEFT AND RIGHT
  function bfs() {
    let queue = [start];
    while (queue.length > 0) {
      let n = queue.shift();
      let node = nodes[n];
      let currEdge = interiorMap[n];

      if (node.left) {
        let neighborEdge = interiorMap[node.left];
        let neighborNode = nodes[node.left];
        neighborNode.depth = node.depth + 1;
        maxDepth = Math.max(maxDepth, node.depth + 1);
        let e = createEdge(
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
        let neighborEdge = interiorMap[node.right];
        let neighborNode = nodes[node.right];
        neighborNode.depth = node.depth + 1;
        maxDepth = Math.max(maxDepth, node.depth + 1);
        let e = createEdge(
          currEdge.midpoint,
          neighborEdge.midpoint,
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
  return { solution, maxDepth, nodes };
};

export const getCodewordEdges = (points, codeword) => {
  const N = points.length;
  const getWrapIndex = (idx) => idx % N;
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
